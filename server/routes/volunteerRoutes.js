const express = require('express');
const router = express.Router();
const {
  getNearbyVolunteers,
  updateAvailability,
  acceptEmergency,
  rejectEmergency,
  getActiveEmergency,
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', protect, getNearbyVolunteers);
router.put('/availability', protect, authorize('volunteer', 'admin'), updateAvailability);
router.post('/accept/:id', protect, authorize('volunteer'), acceptEmergency);
router.post('/reject/:id', protect, authorize('volunteer'), rejectEmergency);
router.get('/active-emergency', protect, authorize('volunteer'), getActiveEmergency);

module.exports = router;
