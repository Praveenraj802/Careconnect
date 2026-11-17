const Emergency = require('../models/Emergency');
const Volunteer = require('../models/Volunteer');
const Notification = require('../models/Notification');
const socketService = require('../services/socketService');
const { calculateDistanceKm, formatDistance, estimateETA } = require('../utils/geoUtils');

// @desc    Create a new emergency request
// @route   POST /api/emergencies
// @access  Private
exports.createEmergency = async (req, res, next) => {
  try {
    const {
      category,
      urgencyLevel = 'High',
      description,
      contactPhone,
      latitude,
      longitude,
      address,
      landmark,
      peopleAffected = 1,
    } = req.body;

    if (!category || !description || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Category, description, and contact phone number are required.',
      });
    }

    const lng = Number(longitude || (req.user.location && req.user.location.coordinates[0]) || 77.5946);
    const lat = Number(latitude || (req.user.location && req.user.location.coordinates[1]) || 12.9716);

    // Initial timeline entry
    const initialTimeline = [
      {
        status: 'PENDING',
        timestamp: new Date(),
        note: `Emergency reported: ${category} (${urgencyLevel} priority)`,
        updatedBy: req.user._id,
      },
    ];

    // Find suitable nearby volunteers matching category and availability
    const searchRadiusKm = Number(process.env.DEFAULT_SEARCH_RADIUS_KM || 15);
    const allAvailableVolunteers = await Volunteer.find({
      isAvailable: true,
      activeEmergencyId: null,
      categories: category,
    }).populate('userId', 'name email phone');

    // Filter within search radius and sort by distance
    const matchedVolunteers = allAvailableVolunteers
      .map((vol) => {
        const vCoords = vol.currentLocation && vol.currentLocation.coordinates
          ? vol.currentLocation.coordinates
          : [77.5946, 12.9716];
        const distKm = calculateDistanceKm([lng, lat], vCoords);
        return {
          volunteer: vol,
          distanceKm: distKm,
        };
      })
      .filter((item) => item.distanceKm <= searchRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const notifiedVolunteerIds = matchedVolunteers.map((m) => m.volunteer._id);
    const notifiedUserIds = matchedVolunteers
      .map((m) => m.volunteer.userId && m.volunteer.userId._id)
      .filter(Boolean);

    // Create Emergency document
    const emergency = await Emergency.create({
      userId: req.user._id,
      category,
      urgencyLevel,
      description,
      contactPhone,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        address: address || 'Current Location',
        landmark: landmark || '',
      },
      status: 'PENDING',
      notifiedVolunteers: notifiedVolunteerIds,
      timeline: initialTimeline,
      peopleAffected: Number(peopleAffected) || 1,
    });

    const populatedEmergency = await Emergency.findById(emergency._id).populate(
      'userId',
      'name email phone avatar'
    );

    // Create notifications for matched volunteers
    if (notifiedUserIds.length > 0) {
      const notificationDocs = notifiedUserIds.map((uId) => ({
        recipient: uId,
        emergencyId: emergency._id,
        title: `🚨 Urgent: New ${category} Emergency Nearby`,
        message: `${description.substring(0, 80)}... Location: ${address || 'Near you'}`,
        type: 'EMERGENCY_ALERT',
        data: {
          emergencyId: emergency._id,
          category,
          urgencyLevel,
        },
      }));
      await Notification.insertMany(notificationDocs);
    }

    // Broadcast through Socket.IO
    socketService.emitNewEmergencyAlert(populatedEmergency, notifiedUserIds);

    res.status(201).json({
      success: true,
      message: 'Emergency request created successfully.',
      emergency: populatedEmergency,
      matchedVolunteersCount: matchedVolunteers.length,
      helpersAvailable: matchedVolunteers.length > 0,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get emergency requests (with role filtering)
// @route   GET /api/emergencies
// @access  Private
exports.getEmergencies = async (req, res, next) => {
  try {
    const { status, category, urgency, page = 1, limit = 20, myRequests } = req.query;

    const query = {};

    // If normal user or explicitly requested myRequests, filter by their own userId
    if (req.user.role === 'user' || myRequests === 'true') {
      query.userId = req.user._id;
    } else if (req.user.role === 'volunteer') {
      // Volunteer sees their active/past assignments OR pending emergencies in their categories
      const volunteerProfile = await Volunteer.findOne({ userId: req.user._id });
      if (volunteerProfile) {
        if (status === 'PENDING') {
          query.status = 'PENDING';
          query.category = { $in: volunteerProfile.categories };
          query.rejectedByVolunteers = { $ne: volunteerProfile._id };
        } else {
          // If viewing general list, show cases they were assigned to OR pending
          query.$or = [
            { assignedVolunteer: volunteerProfile._id },
            { status: 'PENDING', category: { $in: volunteerProfile.categories } },
          ];
        }
      }
    }
    // Admin sees everything by default unless filters are applied

    if (status && status !== 'ALL' && req.user.role !== 'volunteer') {
      query.status = status;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (urgency && urgency !== 'ALL') {
      query.urgencyLevel = urgency;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const emergencies = await Emergency.find(query)
      .populate('userId', 'name email phone avatar')
      .populate('assignedVolunteerUser', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Emergency.countDocuments(query);

    res.status(200).json({
      success: true,
      count: emergencies.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      emergencies,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single emergency details by ID
// @route   GET /api/emergencies/:id
// @access  Private
exports.getEmergencyById = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('userId', 'name email phone avatar address location')
      .populate('assignedVolunteer')
      .populate('assignedVolunteerUser', 'name email phone avatar')
      .populate('timeline.updatedBy', 'name role');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found.',
      });
    }

    // Calculate distance and ETA if assigned volunteer has a location
    let volunteerDistance = null;
    if (
      emergency.assignedVolunteer &&
      emergency.assignedVolunteer.currentLocation &&
      emergency.location &&
      emergency.location.coordinates
    ) {
      const distKm = calculateDistanceKm(
        emergency.location.coordinates,
        emergency.assignedVolunteer.currentLocation.coordinates
      );
      volunteerDistance = {
        distanceKm: distKm,
        formatted: formatDistance(distKm),
        etaMinutes: estimateETA(distKm),
      };
    }

    res.status(200).json({
      success: true,
      emergency,
      volunteerDistance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update emergency status (ON_THE_WAY, IN_PROGRESS, COMPLETED, CANCELLED)
// @route   PUT /api/emergencies/:id/status
// @access  Private
exports.updateEmergencyStatus = async (req, res, next) => {
  try {
    const { status, note, cancellationReason, resolutionNotes } = req.body;
    const emergencyId = req.params.id;

    const validStatuses = ['ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const emergency = await Emergency.findById(emergencyId)
      .populate('userId', 'name email phone')
      .populate('assignedVolunteer');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found.',
      });
    }

    // Role and permission check
    const isRequester = emergency.userId._id.toString() === req.user._id.toString();
    const isAssignedVolunteer =
      emergency.assignedVolunteerUser &&
      emergency.assignedVolunteerUser.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Requester can only cancel before completed
    if (isRequester && !isAssignedVolunteer && !isAdmin) {
      if (status !== 'CANCELLED') {
        return res.status(403).json({
          success: false,
          message: 'As the requester, you can only cancel your emergency request.',
        });
      }
    }

    // Status transition rules
    if (['COMPLETED', 'CANCELLED'].includes(emergency.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update emergency that is already ${emergency.status.toLowerCase()}.`,
      });
    }

    emergency.status = status;

    if (cancellationReason) {
      emergency.cancellationReason = cancellationReason;
    }
    if (resolutionNotes) {
      emergency.resolutionNotes = resolutionNotes;
    }

    // Append to timeline
    const statusNote =
      note ||
      (status === 'ON_THE_WAY'
        ? `${req.user.name} is on the way to the location.`
        : status === 'IN_PROGRESS'
        ? `${req.user.name} has arrived at the scene and is providing assistance.`
        : status === 'COMPLETED'
        ? `Emergency resolved successfully. Notes: ${resolutionNotes || 'None'}`
        : `Emergency cancelled. Reason: ${cancellationReason || 'User request'}`);

    emergency.timeline.push({
      status,
      timestamp: new Date(),
      note: statusNote,
      updatedBy: req.user._id,
    });

    // Handle Volunteer state update on COMPLETED or CANCELLED
    if (emergency.assignedVolunteer) {
      const volunteerProfile = await Volunteer.findById(emergency.assignedVolunteer._id || emergency.assignedVolunteer);
      if (volunteerProfile) {
        if (status === 'COMPLETED') {
          volunteerProfile.totalAssisted = (volunteerProfile.totalAssisted || 0) + 1;
          volunteerProfile.activeEmergencyId = null;
          volunteerProfile.isAvailable = true;
          await volunteerProfile.save();
        } else if (status === 'CANCELLED') {
          volunteerProfile.activeEmergencyId = null;
          volunteerProfile.isAvailable = true;
          await volunteerProfile.save();
        }
      }
    }

    await emergency.save();

    const updatedEmergency = await Emergency.findById(emergency._id)
      .populate('userId', 'name email phone avatar')
      .populate('assignedVolunteer')
      .populate('assignedVolunteerUser', 'name email phone avatar');

    // Create notification for other party
    const targetRecipientId = isRequester
      ? emergency.assignedVolunteerUser
      : emergency.userId._id;

    if (targetRecipientId) {
      await Notification.create({
        recipient: targetRecipientId,
        emergencyId: emergency._id,
        title: `Emergency Status: ${status.replace(/_/g, ' ')}`,
        message: statusNote,
        type: 'STATUS_UPDATE',
        data: {
          emergencyId: emergency._id,
          status,
        },
      });
    }

    // Real-time broadcast
    socketService.emitStatusUpdate(updatedEmergency);

    res.status(200).json({
      success: true,
      message: `Emergency status updated to ${status}.`,
      emergency: updatedEmergency,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete/Cancel emergency request
// @route   DELETE /api/emergencies/:id
// @access  Private
exports.deleteEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }

    const isRequester = emergency.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRequester && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this emergency request.',
      });
    }

    // If volunteer was assigned, release them
    if (emergency.assignedVolunteer) {
      await Volunteer.findByIdAndUpdate(emergency.assignedVolunteer, {
        activeEmergencyId: null,
        isAvailable: true,
      });
    }

    emergency.status = 'CANCELLED';
    emergency.cancellationReason = 'Deleted/cancelled by requester or administrator';
    emergency.timeline.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      note: 'Emergency deleted/cancelled',
      updatedBy: req.user._id,
    });
    await emergency.save();

    socketService.emitStatusUpdate(emergency);

    res.status(200).json({
      success: true,
      message: 'Emergency request cancelled successfully.',
    });
  } catch (err) {
    next(err);
  }
};
