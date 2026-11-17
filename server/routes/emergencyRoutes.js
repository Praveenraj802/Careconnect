const express = require('express');
const router = express.Router();
const {
  createEmergency,
  getEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  deleteEmergency,
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createEmergency);
router.get('/', protect, getEmergencies);
router.get('/:id', protect, getEmergencyById);
router.put('/:id/status', protect, updateEmergencyStatus);
router.delete('/:id', protect, deleteEmergency);

module.exports = router;
