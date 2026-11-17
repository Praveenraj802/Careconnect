import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { playEmergencyAlarm, playChime, triggerBrowserNotification } from '../services/soundAlert';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const activeEmergencyIdRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server with ID:', newSocket.id);
      setConnected(true);

      // Authenticate socket session with user details
      newSocket.emit('authenticate', {
        id: user.id || user._id,
        name: user.name,
        role: user.role,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setConnected(false);
    });

    // Volunteer alert received
    newSocket.on('new_emergency_alert', (emergencyData) => {
      console.log('[Socket Alert] Received emergency alert:', emergencyData);
      setIncomingAlert(emergencyData);
      playEmergencyAlarm();
      triggerBrowserNotification(`🚨 Emergency Alert: ${emergencyData.category}`, {
        body: emergencyData.description || 'A person nearby requires urgent assistance!',
      });
    });

    // Someone else claimed it or it was assigned
    newSocket.on('emergency_claimed', (data) => {
      setIncomingAlert((current) => {
        if (current && current.emergencyId === data.emergencyId) {
          return null;
        }
        return current;
      });
    });

    // General status changed
    newSocket.on('emergency_status_changed', (updatedEmergency) => {
      playChime();
      window.dispatchEvent(
        new CustomEvent('careconnect:emergency_updated', {
          detail: updatedEmergency,
        })
      );
    });

    newSocket.on('emergency_assigned', (assignedEmergency) => {
      playChime();
      window.dispatchEvent(
        new CustomEvent('careconnect:emergency_assigned', {
          detail: assignedEmergency,
        })
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id, user?.role]);

  const joinEmergency = (emergencyId) => {
    if (socket && emergencyId) {
      activeEmergencyIdRef.current = emergencyId;
      socket.emit('join_emergency', emergencyId);
    }
  };

  const leaveEmergency = (emergencyId) => {
    if (socket && emergencyId) {
      socket.emit('leave_emergency', emergencyId);
      if (activeEmergencyIdRef.current === emergencyId) {
        activeEmergencyIdRef.current = null;
      }
    }
  };

  const sendVolunteerLocation = (emergencyId, coordinates) => {
    if (socket && emergencyId && user) {
      socket.emit('update_volunteer_location', {
        emergencyId,
        volunteerId: user.id || user._id,
        coordinates,
      });
    }
  };

  const dismissAlert = () => {
    setIncomingAlert(null);
  };

  const value = {
    socket,
    connected,
    incomingAlert,
    dismissAlert,
    joinEmergency,
    leaveEmergency,
    sendVolunteerLocation,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
