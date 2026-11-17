const Volunteer = require('../models/Volunteer');
const Emergency = require('../models/Emergency');
const Notification = require('../models/Notification');
const socketService = require('../services/socketService');
const { calculateDistanceKm, formatDistance, estimateETA } = require('../utils/geoUtils');

// @desc    Get nearby available volunteers
// @route   GET /api/volunteers/nearby
// @access  Private
exports.getNearbyVolunteers = async (req, res, next) => {
  try {
    const {
      longitude,
      latitude,
      category,
      radius = 25, // default 25 km
    } = req.query;

    const lng = Number(longitude || (req.user && req.user.location && req.user.location.coordinates[0]) || 77.5946);
    const lat = Number(latitude || (req.user && req.user.location && req.user.location.coordinates[1]) || 12.9716);
    const searchRadiusKm = Number(radius);

    const query = {
      isAvailable: true,
      activeEmergencyId: null,
    };

    if (category) {
      query.categories = category;
    }

    // Find volunteers
    const volunteers = await Volunteer.find(query)
      .populate('userId', 'name email phone avatar')
      .lean();

    // Calculate distance and filter within radius
    const volunteersWithDistance = volunteers
      .map((vol) => {
        const volCoords = vol.currentLocation && vol.currentLocation.coordinates
          ? vol.currentLocation.coordinates
          : [77.5946, 12.9716];

        const distKm = calculateDistanceKm([lng, lat], volCoords);
        return {
          ...vol,
          distanceKm: distKm,
          distanceFormatted: formatDistance(distKm),
          estimatedETA: estimateETA(distKm),
        };
      })
      .filter((vol) => vol.distanceKm <= searchRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({
      success: true,
      count: volunteersWithDistance.length,
      volunteers: volunteersWithDistance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update volunteer availability status and current location
// @route   PUT /api/volunteers/availability
// @access  Private (Volunteer only)
exports.updateAvailability = async (req, res, next) => {
  try {
    const { isAvailable, longitude, latitude, address } = req.body;

    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer profile not found for this user account.',
      });
    }

    if (typeof isAvailable === 'boolean') {
      volunteer.isAvailable = isAvailable;
    }

    if (longitude !== undefined && latitude !== undefined) {
      volunteer.currentLocation = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    if (address !== undefined) {
      volunteer.address = address;
    }

    volunteer.lastActiveAt = new Date();
    await volunteer.save();

    res.status(200).json({
      success: true,
      message: `Status updated to ${volunteer.isAvailable ? 'Available (Online)' : 'Unavailable (Offline)'}`,
      volunteer,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Safely accept an emergency request (Atomic Assignment)
// @route   POST /api/volunteers/accept/:id
// @access  Private (Volunteer only)
exports.acceptEmergency = async (req, res, next) => {
  try {
    const emergencyId = req.params.id;

    // Get current volunteer profile
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) {
      return res.status(403).json({
        success: false,
        message: 'Only registered volunteers can accept emergency assignments.',
      });
    }

    // Check if volunteer is already committed to an active emergency
    if (volunteer.activeEmergencyId) {
      const activeEmerg = await Emergency.findById(volunteer.activeEmergencyId);
      if (activeEmerg && ['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS'].includes(activeEmerg.status)) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active emergency in progress. Please complete it first.',
        });
      }
    }

    // Atomic server-side assignment: find where status is PENDING and no assigned volunteer
    const assignmentTimelineItem = {
      status: 'ACCEPTED',
      timestamp: new Date(),
      note: `Accepted by volunteer ${req.user.name} (${volunteer.phone || req.user.phone})`,
      updatedBy: req.user._id,
    };

    const assignedEmergency = await Emergency.findOneAndUpdate(
      {
        _id: emergencyId,
        status: 'PENDING',
        assignedVolunteer: null,
      },
      {
        $set: {
          status: 'ACCEPTED',
          assignedVolunteer: volunteer._id,
          assignedVolunteerUser: req.user._id,
        },
        $push: {
          timeline: assignmentTimelineItem,
        },
      },
      {
        new: true,
      }
    )
      .populate('userId', 'name email phone avatar address location')
      .populate('assignedVolunteerUser', 'name email phone avatar');

    if (!assignedEmergency) {
      return res.status(409).json({
        success: false,
        message: 'This emergency has already been accepted by another volunteer or was cancelled.',
      });
    }

    // Mark volunteer's active emergency
    volunteer.activeEmergencyId = assignedEmergency._id;
    volunteer.isAvailable = false;
    volunteer.lastActiveAt = new Date();
    await volunteer.save();

    // Create persistent notification for requester
    await Notification.create({
      recipient: assignedEmergency.userId._id,
      emergencyId: assignedEmergency._id,
      title: 'Volunteer Assigned!',
      message: `${req.user.name} has accepted your emergency request and is preparing to assist.`,
      type: 'ASSIGNMENT',
      data: {
        volunteerName: req.user.name,
        volunteerPhone: volunteer.phone || req.user.phone,
        emergencyId: assignedEmergency._id,
      },
    });

    // Real-time broadcast
    socketService.emitEmergencyAssigned(assignedEmergency);

    res.status(200).json({
      success: true,
      message: 'Emergency request accepted successfully. You are now assigned to this case.',
      emergency: assignedEmergency,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject/Decline an emergency alert (volunteer dismisses)
// @route   POST /api/volunteers/reject/:id
// @access  Private (Volunteer only)
exports.rejectEmergency = async (req, res, next) => {
  try {
    const emergencyId = req.params.id;
    const volunteer = await Volunteer.findOne({ userId: req.user._id });

    if (volunteer) {
      await Emergency.findByIdAndUpdate(emergencyId, {
        $addToSet: { rejectedByVolunteers: volunteer._id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency dismissed.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently active assigned emergency for logged in volunteer
// @route   GET /api/volunteers/active-emergency
// @access  Private (Volunteer only)
exports.getActiveEmergency = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer profile not found.' });
    }

    const activeEmergency = await Emergency.findOne({
      assignedVolunteer: volunteer._id,
      status: { $in: ['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS'] },
    })
      .populate('userId', 'name email phone address location avatar')
      .populate('assignedVolunteerUser', 'name email phone avatar');

    res.status(200).json({
      success: true,
      emergency: activeEmergency || null,
    });
  } catch (err) {
    next(err);
  }
};
