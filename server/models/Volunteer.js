const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    categories: {
      type: [String],
      enum: [
        'Medical',
        'Road Accident',
        'Vehicle Breakdown',
        'Fire Emergency',
        'General Urgent',
      ],
      default: ['Medical', 'General Urgent'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A volunteer must select at least one assistance category.',
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [77.5946, 12.9716],
      },
    },
    address: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    vehicleType: {
      type: String,
      enum: ['None', 'Two-Wheeler', 'Four-Wheeler', 'Ambulance / Emergency Vehicle'],
      default: 'Two-Wheeler',
    },
    serviceRadiusKm: {
      type: Number,
      default: 15,
      min: 1,
      max: 100,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
    },
    totalAssisted: {
      type: Number,
      default: 0,
    },
    activeEmergencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Emergency',
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for fast geospatial nearest-neighbor queries
volunteerSchema.index({ currentLocation: '2dsphere' });
volunteerSchema.index({ isAvailable: 1, categories: 1 });

module.exports = mongoose.model('Volunteer', volunteerSchema);
