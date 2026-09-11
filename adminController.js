const Farmer = require('../models/Farmer');
const Consumer = require('../models/Consumer');
const Product = require('../models/Product');
const Order = require('../models/Order');

const getDashboard = async (req, res) => {
  try {
    const [totalFarmers, totalConsumers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
      Farmer.countDocuments(),
      Consumer.countDocuments({ role: 'consumer' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, revenue: { $sum: '$totalAmount' } } }]),
    ]);

    return res.json({
      totalFarmers,
      totalConsumers,
      totalProducts,
      totalOrders,
      revenue: totalRevenue[0]?.revenue || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch admin dashboard' });
  }
};

const getFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find({}).select('-password');
    return res.json(farmers);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch farmer list' });
  }
};

const approveFarmer = async (req, res) => {
  try {
    const { approved } = req.body;
    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    farmer.isVerified = approved === true;
    await farmer.save();

    return res.json({ message: `Farmer ${approved ? 'approved' : 'rejected'} successfully`, farmer });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update farmer status' });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('consumer', 'name email')
      .populate({
        path: 'items.product',
        model: 'Product',
        populate: { path: 'farmer', model: 'Farmer', select: 'name farmName location' },
      });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch orders' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const [categoryStats, locationStats, statusStats] = await Promise.all([
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Product.aggregate([{ $group: { _id: '$location', count: { $sum: 1 } } }]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    return res.json({
      categoryStats,
      locationStats,
      statusStats,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to compute analytics' });
  }
};

module.exports = {
  getDashboard,
  getFarmers,
  approveFarmer,
  getOrders,
  getAnalytics,
};
