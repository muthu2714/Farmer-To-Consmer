const Product = require('../models/Product');
const Farmer = require('../models/Farmer');

const getProducts = async (req, res) => {
  try {
    const { category, location, farmer, organic, search } = req.query;
    const filters = {};

    if (category) filters.category = category;
    if (location) filters.location = new RegExp(location, 'i');
    if (farmer) filters.farmer = farmer;
    if (organic !== undefined) filters.isOrganic = organic === 'true';
    if (search) filters.name = new RegExp(search, 'i');

    const products = await Product.find(filters)
      .populate('farmer', 'name farmName location isVerified profileImage');

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch products' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmer', 'name farmName location isVerified profileImage');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch product' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, category, price, unit, stock, availability, harvestDate, location, isOrganic, image, description } = req.body;

    if (!name || !category || !price || !unit || !harvestDate || !location) {
      return res.status(400).json({ message: 'Please provide all required product details' });
    }

    const farmer = await Farmer.findById(req.user.id || req.user._id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    const product = await Product.create({
      name,
      category,
      price,
      unit,
      stock: stock || 0,
      availability: availability !== undefined ? availability : true,
      harvestDate,
      farmer: farmer._id,
      location,
      isOrganic: isOrganic !== undefined ? isOrganic : true,
      image,
      description,
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Product creation failed' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.farmer.toString() !== (req.user.id || req.user._id).toString()) {
      return res.status(403).json({ message: 'You can only update your own products' });
    }

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) product[key] = req.body[key];
    });

    const updatedProduct = await product.save();
    return res.json(updatedProduct);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Product update failed' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.farmer.toString() !== (req.user.id || req.user._id).toString()) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }

    await product.deleteOne();
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Product deletion failed' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
