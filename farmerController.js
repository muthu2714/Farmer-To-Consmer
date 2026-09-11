const Farmer = require('../models/Farmer');
const Product = require('../models/Product');
const Order = require('../models/Order');

const getFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find({}).select('-password');
    return res.json(farmers);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch farmers' });
  }
};

const getFarmerById = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id).select('-password');
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    return res.json(farmer);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch farmer details' });
  }
};

const updateFarmerProfile = async (req, res) => {
  try {
    const allowedFields = ['farmName', 'location', 'cropTypes', 'farmingMethod', 'isVerified', 'phone', 'bio', 'profileImage'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    return res.json(farmer);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Profile update failed' });
  }
};

const getFarmerProducts = async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.params.id }).populate('farmer', 'name farmName location');
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch farmer products' });
  }
};

const getFarmerDashboard = async (req, res) => {
  try {
    const farmerId = req.user._id || req.user.id;
    const products = await Product.find({ farmer: farmerId });
    const orders = await Order.find().populate({
      path: 'items.product',
      model: 'Product',
      populate: {
        path: 'farmer',
        model: 'Farmer',
      },
    }).populate('consumer', 'name email');

    const farmerOrders = orders.filter((order) =>
      order.items.some((item) => item.product && item.product.farmer && item.product.farmer._id.toString() === farmerId.toString())
    );

    const summary = {
      totalProducts: products.length,
      totalSales: farmerOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      activeOrders: farmerOrders.filter((order) => order.status !== 'Delivered').length,
      totalRevenue: farmerOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    };

    return res.json({ products, orders: farmerOrders, summary });
  } catch (error) {
    console.error('Farmer dashboard error:', error);
    return res.status(500).json({ message: 'Unable to load dashboard data' });
  }
};

module.exports = {
  getFarmers,
  getFarmerById,
  updateFarmerProfile,
  getFarmerProducts,
  getFarmerDashboard,
};
