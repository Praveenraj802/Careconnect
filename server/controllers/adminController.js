const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const Emergency = require('../models/Emergency');

// @desc    Get admin dashboard metrics & summary
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalVolunteers,
      availableVolunteersCount,
      totalEmergencies,
      pendingCount,
      inProgressCount,
      completedCount,
      cancelledCount,
      recentEmergencies,
      categoryStats,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'volunteer' }),
      Volunteer.countDocuments({ isAvailable: true, activeEmergencyId: null }),
      Emergency.countDocuments(),
      Emergency.countDocuments({ status: 'PENDING' }),
      Emergency.countDocuments({ status: { $in: ['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS'] } }),
      Emergency.countDocuments({ status: 'COMPLETED' }),
      Emergency.countDocuments({ status: 'CANCELLED' }),
      Emergency.find()
        .populate('userId', 'name email phone avatar')
        .populate('assignedVolunteerUser', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Emergency.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format category stats
    const categoryBreakdown = {};
    categoryStats.forEach((cat) => {
      categoryBreakdown[cat._id] = cat.count;
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalVolunteers,
        availableVolunteersCount,
        totalEmergencies,
        pendingEmergencies: pendingCount,
        activeEmergencies: inProgressCount,
        completedEmergencies: completedCount,
        cancelledEmergencies: cancelledCount,
        categoryBreakdown,
        recentEmergencies,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all registered users & volunteers
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role && role !== 'ALL') {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await User.countDocuments(query);

    // If volunteer, attach volunteer profile details
    const usersWithProfiles = await Promise.all(
      users.map(async (u) => {
        if (u.role === 'volunteer') {
          const vol = await Volunteer.findOne({ userId: u._id }).lean();
          return { ...u, volunteerProfile: vol };
        }
        return u;
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithProfiles.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      users: usersWithProfiles,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user active status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin' && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot deactivate their own active account.',
      });
    }

    user.isActive = Boolean(isActive);
    await user.save();

    // If volunteer, also update availability
    if (user.role === 'volunteer') {
      await Volunteer.findOneAndUpdate(
        { userId: user._id },
        { isAvailable: Boolean(isActive) }
      );
    }

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all emergencies for admin monitoring
// @route   GET /api/admin/emergencies
// @access  Private (Admin only)
exports.getAllEmergencies = async (req, res, next) => {
  try {
    const { status, category, urgency, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (category && category !== 'ALL') query.category = category;
    if (urgency && urgency !== 'ALL') query.urgencyLevel = urgency;

    const skip = (Number(page) - 1) * Number(limit);

    const emergencies = await Emergency.find(query)
      .populate('userId', 'name email phone avatar')
      .populate('assignedVolunteer')
      .populate('assignedVolunteerUser', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Emergency.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      emergencies,
    });
  } catch (err) {
    next(err);
  }
};
