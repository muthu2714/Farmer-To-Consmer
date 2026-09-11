const Order = require('../models/Order');
const Product = require('../models/Product');
const Consumer = require('../models/Consumer');

const createOrder = async (req, res) => {
  try {
    const { items, deliverySlot } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    if (!deliverySlot) {
      return res.status(400).json({ message: 'Please select a delivery slot' });
    }

    let totalAmount = 0;
    const preparedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product).populate('farmer', 'name location');

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      if (!product.availability || product.stock < item.quantity) {
        return res.status(400).json({ message: `Selected product is not available: ${product.name}` });
      }

      const unitPrice = Number(product.price);
      const quantity = Number(item.quantity);
      totalAmount += unitPrice * quantity;

      preparedItems.push({
        product: product._id,
        quantity,
        price: unitPrice,
      });
    }

    const order = await Order.create({
      consumer: req.user.id || req.user._id,
      items: preparedItems,
      totalAmount,
      deliverySlot,
      status: 'Placed',
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(500).json({ message: error.message || 'Order creation failed' });
  }
};

const getOrders = async (req, res) => {
  try {
    const query = req.user.role === 'consumer' ? { consumer: req.user.id || req.user._id } : {};

    const orders = await Order.find(query)
      .populate({
        path: 'items.product',
        model: 'Product',
        populate: { path: 'farmer', model: 'Farmer', select: 'name farmName location' },
      })
      .populate('consumer', 'name email');

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'items.product',
        model: 'Product',
        populate: { path: 'farmer', model: 'Farmer', select: 'name farmName location' },
      })
      .populate('consumer', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Placed', 'Confirmed', 'Delivered'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status selected' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update order status' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
