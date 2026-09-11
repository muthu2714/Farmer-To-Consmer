const express = require('express');
const { protect, authorize } = require('../controllers/authController');
const { getDashboard, getFarmers, approveFarmer, getOrders, getAnalytics } = require('../controllers/adminController');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), getDashboard);
router.get('/farmers', protect, authorize('admin'), getFarmers);
router.put('/farmers/:id/approve', protect, authorize('admin'), approveFarmer);
router.get('/orders', protect, authorize('admin'), getOrders);
router.get('/analytics', protect, authorize('admin'), getAnalytics);

module.exports = router;
