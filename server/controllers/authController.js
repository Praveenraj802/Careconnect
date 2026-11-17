const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'careconnect_super_secret_jwt_key_2026_dev_secure',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

// @desc    Register a new user or volunteer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'user',
      phone,
      address,
      latitude,
      longitude,
      // Volunteer specific fields
      categories,
      vehicleType,
      serviceRadiusKm,
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Default coords if not provided
    const userLng = longitude !== undefined && longitude !== null ? Number(longitude) : 77.5946;
    const userLat = latitude !== undefined && latitude !== null ? Number(latitude) : 12.9716;

    // Create User record
    const user = await User.create({
      name,
      email,
      password,
      role: ['user', 'volunteer', 'admin'].includes(role) ? role : 'user',
      phone,
      address: address || '',
      location: {
        type: 'Point',
        coordinates: [userLng, userLat],
      },
    });

    let volunteerProfile = null;

    // If registering as volunteer, create corresponding Volunteer profile
    if (user.role === 'volunteer') {
      const selectedCategories =
        Array.isArray(categories) && categories.length > 0
          ? categories
          : ['Medical', 'General Urgent'];

      volunteerProfile = await Volunteer.create({
        userId: user._id,
        categories: selectedCategories,
        isAvailable: true,
        currentLocation: {
          type: 'Point',
          coordinates: [userLng, userLat],
        },
        address: address || '',
        phone: phone,
        vehicleType: vehicleType || 'Two-Wheeler',
        serviceRadiusKm: serviceRadiusKm ? Number(serviceRadiusKm) : 15,
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account successfully registered.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        location: user.location,
        volunteerProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & return JWT token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Check for user and include password field for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator.',
      });
    }

    // If volunteer, get volunteer profile
    let volunteerProfile = null;
    if (user.role === 'volunteer') {
      volunteerProfile = await Volunteer.findOne({ userId: user._id });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        location: user.location,
        volunteerProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    let volunteerProfile = null;
    if (user.role === 'volunteer') {
      volunteerProfile = await Volunteer.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        location: user.location,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        volunteerProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update current logged in user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      address,
      latitude,
      longitude,
      // Volunteer fields
      categories,
      vehicleType,
      serviceRadiusKm,
      isAvailable,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;

    if (latitude !== undefined && longitude !== undefined) {
      user.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    await user.save();

    let volunteerProfile = null;
    if (user.role === 'volunteer') {
      volunteerProfile = await Volunteer.findOne({ userId: user._id });

      if (volunteerProfile) {
        if (categories && Array.isArray(categories)) volunteerProfile.categories = categories;
        if (vehicleType) volunteerProfile.vehicleType = vehicleType;
        if (serviceRadiusKm) volunteerProfile.serviceRadiusKm = Number(serviceRadiusKm);
        if (typeof isAvailable === 'boolean') volunteerProfile.isAvailable = isAvailable;
        if (phone) volunteerProfile.phone = phone;
        if (address !== undefined) volunteerProfile.address = address;

        if (latitude !== undefined && longitude !== undefined) {
          volunteerProfile.currentLocation = {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          };
        }

        volunteerProfile.lastActiveAt = new Date();
        await volunteerProfile.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        location: user.location,
        volunteerProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};
