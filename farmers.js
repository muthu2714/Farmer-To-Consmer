const express = require('express');
const { protect, authorize } = require('../controllers/authController');
const {
  getFarmers,
  getFarmerById,
  updateFarmerProfile,
  getFarmerProducts,
  getFarmerDashboard,
} = require('../controllers/farmerController');

const router = express.Router();

router.get('/', getFarmers);
router.get('/:id', getFarmerById);
router.put('/:id', protect, authorize('farmer'), updateFarmerProfile);
router.get('/:id/products', getFarmerProducts);
router.get('/dashboard/me', protect, authorize('farmer'), getFarmerDashboard);

module.exports = router;
