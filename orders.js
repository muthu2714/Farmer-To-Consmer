const express = require('express');
const { protect, authorize } = require('../controllers/authController');
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');

const router = express.Router();

router.post('/', protect, authorize('consumer'), createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('farmer', 'admin'), updateOrderStatus);

module.exports = router;
