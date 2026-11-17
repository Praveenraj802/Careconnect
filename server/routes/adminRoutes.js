const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getAllEmergencies,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/emergencies', getAllEmergencies);

module.exports = router;
