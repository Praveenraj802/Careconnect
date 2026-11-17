let ioInstance = null;
const userSocketsMap = new Map(); // userId -> Set of socket IDs

const initSocketIO = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] New connection established: ${socket.id}`);

    // Client registers their user identity and role
    socket.on('authenticate', (userData) => {
      if (!userData || !userData.id) return;
      const userId = userData.id.toString();
      socket.userId = userId;
      socket.userRole = userData.role;

      // Join user specific room
      socket.join(`user:${userId}`);

      // Join role specific rooms
      if (userData.role === 'volunteer') {
        socket.join('role:volunteer');
      }
      if (userData.role === 'admin') {
        socket.join('role:admin');
      }

      if (!userSocketsMap.has(userId)) {
        userSocketsMap.set(userId, new Set());
      }
      userSocketsMap.get(userId).add(socket.id);

      console.log(`[Socket] User ${userData.name || userId} (${userData.role}) registered on socket ${socket.id}`);
    });

    // Join emergency specific room for live tracking
    socket.on('join_emergency', (emergencyId) => {
      if (emergencyId) {
        socket.join(`emergency:${emergencyId}`);
        console.log(`[Socket] ${socket.id} joined room emergency:${emergencyId}`);
      }
    });

    // Leave emergency room
    socket.on('leave_emergency', (emergencyId) => {
      if (emergencyId) {
        socket.leave(`emergency:${emergencyId}`);
      }
    });

    // Volunteer sends live location update
    socket.on('update_volunteer_location', (data) => {
      // data: { emergencyId, volunteerId, coordinates: [lng, lat] }
      if (data && data.emergencyId) {
        socket.to(`emergency:${data.emergencyId}`).emit('volunteer_location_update', {
          volunteerId: data.volunteerId,
          coordinates: data.coordinates,
          timestamp: new Date(),
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      if (socket.userId && userSocketsMap.has(socket.userId)) {
        const set = userSocketsMap.get(socket.userId);
        set.delete(socket.id);
        if (set.size === 0) {
          userSocketsMap.delete(socket.userId);
        }
      }
    });
  });
};

const getIO = () => {
  return ioInstance;
};

// Dispatch alerts to matched volunteers
const emitNewEmergencyAlert = (emergency, volunteerUserIds = []) => {
  if (!ioInstance) return;

  const payload = {
    emergencyId: emergency._id,
    category: emergency.category,
    urgencyLevel: emergency.urgencyLevel,
    description: emergency.description,
    location: emergency.location,
    createdAt: emergency.createdAt,
    contactPhone: emergency.contactPhone,
    peopleAffected: emergency.peopleAffected,
  };

  // If specific volunteer user IDs provided, send directly to each
  if (volunteerUserIds && volunteerUserIds.length > 0) {
    volunteerUserIds.forEach((vUserId) => {
      ioInstance.to(`user:${vUserId.toString()}`).emit('new_emergency_alert', payload);
    });
  } else {
    // Broadcast to all active volunteers
    ioInstance.to('role:volunteer').emit('new_emergency_alert', payload);
  }

  // Also broadcast to admin dashboard
  ioInstance.to('role:admin').emit('admin_emergency_created', emergency);
};

// Notify when an emergency is claimed/assigned
const emitEmergencyAssigned = (emergency) => {
  if (!ioInstance) return;

  // Inform emergency room (requester + assigned volunteer)
  ioInstance.to(`emergency:${emergency._id}`).emit('emergency_assigned', emergency);

  // Inform user directly
  if (emergency.userId) {
    const userTargetId = emergency.userId._id ? emergency.userId._id.toString() : emergency.userId.toString();
    ioInstance.to(`user:${userTargetId}`).emit('emergency_assigned', emergency);
  }

  // Broadcast to all volunteers that this emergency was claimed so they dismiss the prompt
  ioInstance.to('role:volunteer').emit('emergency_claimed', {
    emergencyId: emergency._id,
    assignedVolunteer: emergency.assignedVolunteer,
  });

  // Notify admin
  ioInstance.to('role:admin').emit('admin_emergency_updated', emergency);
};

// Notify status updates (ON_THE_WAY, IN_PROGRESS, COMPLETED, CANCELLED)
const emitStatusUpdate = (emergency) => {
  if (!ioInstance) return;

  // Emit to emergency tracking room
  ioInstance.to(`emergency:${emergency._id}`).emit('emergency_status_changed', emergency);

  // Emit to requester
  if (emergency.userId) {
    const userTargetId = emergency.userId._id ? emergency.userId._id.toString() : emergency.userId.toString();
    ioInstance.to(`user:${userTargetId}`).emit('emergency_status_changed', emergency);
  }

  // Emit to assigned volunteer user
  if (emergency.assignedVolunteerUser) {
    const vUserId = emergency.assignedVolunteerUser._id
      ? emergency.assignedVolunteerUser._id.toString()
      : emergency.assignedVolunteerUser.toString();
    ioInstance.to(`user:${vUserId}`).emit('emergency_status_changed', emergency);
  }

  // Notify admins
  ioInstance.to('role:admin').emit('admin_emergency_updated', emergency);
};

module.exports = {
  initSocketIO,
  getIO,
  emitNewEmergencyAlert,
  emitEmergencyAssigned,
  emitStatusUpdate,
};
