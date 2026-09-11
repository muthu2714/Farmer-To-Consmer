const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');
const Consumer = require('../models/Consumer');

const JWT_SECRET = process.env.JWT_SECRET || 'agriconnect_super_secret_key_2026';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
};

const getUserByRoleAndId = async (role, id) => {
  if (role === 'farmer') {
    return Farmer.findById(id).select('-password');
  }

  if (role === 'consumer' || role === 'admin') {
    return Consumer.findById(id).select('-password');
  }

  return null;
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, farmName, location, cropTypes, farmingMethod, phone, profileImage } = req.body;

    const normalizedRole = role || 'consumer';
    const existingEmail = normalizedRole === 'farmer'
      ? await Farmer.findOne({ email })
      : await Consumer.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const userData = {
      name,
      email,
      password,
      role: normalizedRole,
      location,
      phone,
      profileImage,
    };

    if (normalizedRole === 'farmer') {
      userData.farmName = farmName || name;
      userData.cropTypes = cropTypes || [];
      userData.farmingMethod = farmingMethod || 'Organic';
    }

    const user = normalizedRole === 'farmer'
      ? await Farmer.create(userData)
      : await Consumer.create(userData);

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmName: user.farmName || null,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = null;

    if (role === 'farmer') {
      user = await Farmer.findOne({ email });
    } else if (role === 'consumer' || role === 'admin') {
      user = await Consumer.findOne({ email, role });
    } else {
      user = (await Farmer.findOne({ email })) || (await Consumer.findOne({ email }));
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmName: user.farmName || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getUserByRoleAndId(decoded.role, decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient role permissions' });
  }

  next();
};

module.exports = {
  register,
  login,
  protect,
  authorize,
  generateToken,
};
