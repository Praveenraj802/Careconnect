const mongoose = require('mongoose');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const Emergency = require('../models/Emergency');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[Seed] Database already contains records. Skipping seed.');
      return;
    }

    console.log('[Seed] Starting database seeding with sample production-style data...');

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@careconnect.org',
      password: 'admin123',
      role: 'admin',
      phone: '+91 98765 00001',
      address: 'CareConnect Headquarters, Central Hub',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
      },
    });

    // 2. Create Normal Users
    const user1 = await User.create({
      name: 'Praveen Kumar',
      email: 'user@careconnect.org',
      password: 'user123',
      role: 'user',
      phone: '+91 98765 11111',
      address: 'Indiranagar 100ft Road, Bengaluru',
      location: {
        type: 'Point',
        coordinates: [77.6412, 12.9784],
      },
    });

    const user2 = await User.create({
      name: 'Ananya Sharma',
      email: 'ananya@careconnect.org',
      password: 'user123',
      role: 'user',
      phone: '+91 98765 22222',
      address: 'Koramangala 5th Block, Bengaluru',
      location: {
        type: 'Point',
        coordinates: [77.6245, 12.9352],
      },
    });

    // 3. Create Volunteers
    // Volunteer 1: Dr. Sarah (Medical Specialist)
    const volUser1 = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.medical@careconnect.org',
      password: 'volunteer123',
      role: 'volunteer',
      phone: '+91 98765 33331',
      address: 'Near Manipal Hospital, HAL Airport Rd',
      location: {
        type: 'Point',
        coordinates: [77.6521, 12.9583],
      },
    });

    const volProfile1 = await Volunteer.create({
      userId: volUser1._id,
      categories: ['Medical', 'General Urgent'],
      isAvailable: true,
      currentLocation: {
        type: 'Point',
        coordinates: [77.6521, 12.9583],
      },
      phone: volUser1.phone,
      address: volUser1.address,
      vehicleType: 'Ambulance / Emergency Vehicle',
      serviceRadiusKm: 20,
      rating: 4.9,
      totalAssisted: 14,
    });

    // Volunteer 2: Mike (Paramedic & Road Accident Rescue)
    const volUser2 = await User.create({
      name: 'Michael Chang (Paramedic)',
      email: 'mike.paramedic@careconnect.org',
      password: 'volunteer123',
      role: 'volunteer',
      phone: '+91 98765 33332',
      address: 'Richmond Town, Bengaluru',
      location: {
        type: 'Point',
        coordinates: [77.6042, 12.9658],
      },
    });

    const volProfile2 = await Volunteer.create({
      userId: volUser2._id,
      categories: ['Road Accident', 'Medical'],
      isAvailable: true,
      currentLocation: {
        type: 'Point',
        coordinates: [77.6042, 12.9658],
      },
      phone: volUser2.phone,
      address: volUser2.address,
      vehicleType: 'Four-Wheeler',
      serviceRadiusKm: 15,
      rating: 4.8,
      totalAssisted: 22,
    });

    // Volunteer 3: Rohit (Vehicle Breakdown & Roadside Support)
    const volUser3 = await User.create({
      name: 'Rohit Verma (Auto Rescue)',
      email: 'rohit.rescue@careconnect.org',
      password: 'volunteer123',
      role: 'volunteer',
      phone: '+91 98765 33333',
      address: 'HSR Layout Sector 1, Bengaluru',
      location: {
        type: 'Point',
        coordinates: [77.6389, 12.9121],
      },
    });

    const volProfile3 = await Volunteer.create({
      userId: volUser3._id,
      categories: ['Vehicle Breakdown', 'General Urgent'],
      isAvailable: true,
      currentLocation: {
        type: 'Point',
        coordinates: [77.6389, 12.9121],
      },
      phone: volUser3.phone,
      address: volUser3.address,
      vehicleType: 'Two-Wheeler',
      serviceRadiusKm: 12,
      rating: 5.0,
      totalAssisted: 9,
    });

    // Volunteer 4: Priya (Fire & Disaster Safety Volunteer)
    const volUser4 = await User.create({
      name: 'Priya Sundaram (Fire & Safety)',
      email: 'priya.safety@careconnect.org',
      password: 'volunteer123',
      role: 'volunteer',
      phone: '+91 98765 33334',
      address: 'MG Road Metro Station Area',
      location: {
        type: 'Point',
        coordinates: [77.6094, 12.9756],
      },
    });

    const volProfile4 = await Volunteer.create({
      userId: volUser4._id,
      categories: ['Fire Emergency', 'Road Accident', 'General Urgent'],
      isAvailable: true,
      currentLocation: {
        type: 'Point',
        coordinates: [77.6094, 12.9756],
      },
      phone: volUser4.phone,
      address: volUser4.address,
      vehicleType: 'Four-Wheeler',
      serviceRadiusKm: 25,
      rating: 4.95,
      totalAssisted: 31,
    });

    // 4. Sample Completed Emergency (Historical Case)
    await Emergency.create({
      userId: user1._id,
      category: 'Medical',
      urgencyLevel: 'Critical',
      description: 'Severe asthma breathing distress. Inhaler was empty, needed immediate oxygen assistance.',
      contactPhone: user1.phone,
      location: {
        type: 'Point',
        coordinates: [77.6412, 12.9784],
        address: '100ft Road, Indiranagar, Bengaluru',
        landmark: 'Opposite Metro Pillar 78',
      },
      status: 'COMPLETED',
      assignedVolunteer: volProfile1._id,
      assignedVolunteerUser: volUser1._id,
      notifiedVolunteers: [volProfile1._id, volProfile2._id],
      timeline: [
        {
          status: 'PENDING',
          timestamp: new Date(Date.now() - 3600000 * 2),
          note: 'Emergency reported: Medical (Critical priority)',
          updatedBy: user1._id,
        },
        {
          status: 'ACCEPTED',
          timestamp: new Date(Date.now() - 3600000 * 1.8),
          note: `Accepted by volunteer ${volUser1.name}`,
          updatedBy: volUser1._id,
        },
        {
          status: 'ON_THE_WAY',
          timestamp: new Date(Date.now() - 3600000 * 1.6),
          note: `${volUser1.name} is on the way with emergency medical kit.`,
          updatedBy: volUser1._id,
        },
        {
          status: 'IN_PROGRESS',
          timestamp: new Date(Date.now() - 3600000 * 1.3),
          note: 'Arrived on scene, nebulizer and portable oxygen administered.',
          updatedBy: volUser1._id,
        },
        {
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 3600000 * 0.8),
          note: 'Patient stabilized. Vitals normalized. Family informed.',
          updatedBy: volUser1._id,
        },
      ],
      resolutionNotes: 'Nebulizer and supplemental oxygen given. Vitals returned to 98% SpO2. Emergency resolved safely.',
      peopleAffected: 1,
    });

    // 5. Sample Pending Emergency (Ready for Volunteer to Accept!)
    await Emergency.create({
      userId: user2._id,
      category: 'Road Accident',
      urgencyLevel: 'High',
      description: 'Minor two-wheeler collision at intersection. Rider has scraped knee and bruised shoulder. Conscious and responsive.',
      contactPhone: user2.phone,
      location: {
        type: 'Point',
        coordinates: [77.6245, 12.9352],
        address: 'Koramangala 5th Block Junction, Bengaluru',
        landmark: 'Near Forum Mall Backgate',
      },
      status: 'PENDING',
      notifiedVolunteers: [volProfile2._id, volProfile4._id],
      timeline: [
        {
          status: 'PENDING',
          timestamp: new Date(Date.now() - 600000),
          note: 'Emergency reported: Road Accident (High priority)',
          updatedBy: user2._id,
        },
      ],
      peopleAffected: 1,
    });

    console.log('[Seed] Database successfully populated with initial test accounts and incidents!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('  Admin:     admin@careconnect.org / admin123');
    console.log('  User:      user@careconnect.org / user123');
    console.log('  Volunteer: sarah.medical@careconnect.org / volunteer123');
    console.log('  Volunteer: mike.paramedic@careconnect.org / volunteer123');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('[Seed Error]:', err);
  }
};

module.exports = seedData;

if (require.main === module) {
  require('dotenv').config({ path: '../.env' });
  const { connectDB, closeDB } = require('../config/db');

  (async () => {
    await connectDB();
    await seedData();
    await closeDB();
    process.exit(0);
  })();
}
