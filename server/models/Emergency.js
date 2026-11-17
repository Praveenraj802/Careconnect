const mongoose = require('mongoose');

const timelineItemSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const emergencySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Please select an emergency category'],
      enum: [
        'Medical',
        'Road Accident',
        'Vehicle Breakdown',
        'Fire Emergency',
        'General Urgent',
      ],
    },
    urgencyLevel: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'High',
    },
    description: {
      type: String,
      required: [true, 'Please describe the emergency situation'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates are required'],
      },
      address: {
        type: String,
        default: 'Unknown location',
      },
      landmark: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer',
      default: null,
    },
    assignedVolunteerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notifiedVolunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Volunteer',
      },
    ],
    rejectedByVolunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Volunteer',
      },
    ],
    timeline: [timelineItemSchema],
    cancellationReason: {
      type: String,
      default: '',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    peopleAffected: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for location
emergencySchema.index({ 'location': '2dsphere' });
emergencySchema.index({ status: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Emergency', emergencySchema);
