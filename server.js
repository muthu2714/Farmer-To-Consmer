const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const Farmer = require('./models/Farmer');
const Consumer = require('./models/Consumer');
const Product = require('./models/Product');
const Order = require('./models/Order');

const authRoutes = require('./routes/auth');
const farmerRoutes = require('./routes/farmers');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const frontendDir = path.join(__dirname, '../frontend');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(frontendDir));

const servePage = (pageName) => (req, res) => {
  res.sendFile(path.join(frontendDir, pageName));
};

app.get('/', servePage('index.html'));
app.get('/login', servePage('login.html'));
app.get('/register', servePage('register.html'));
app.get('/farmer-dashboard', servePage('farmer-dashboard.html'));
app.get('/consumer-dashboard', servePage('consumer-dashboard.html'));
app.get('/admin-dashboard', servePage('admin-dashboard.html'));

const sampleFarmers = [
  {
    name: 'Ramesh Kumar',
    email: 'ramesh@agriconnect.com',
    password: 'Farmer123!',
    role: 'farmer',
    farmName: 'Green Valley Farms',
    location: 'Coimbatore',
    cropTypes: ['Tomato', 'Carrot', 'Cucumber'],
    farmingMethod: 'Organic',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
    phone: '+91 98765 43210',
    bio: 'Specializing in pesticide-free vegetables and seasonal harvests.'
  },
  {
    name: 'Sundaram Iyer',
    email: 'sundaram@agriconnect.com',
    password: 'Farmer123!',
    role: 'farmer',
    farmName: 'Hillcrest Harvest',
    location: 'Ooty',
    cropTypes: ['Apple', 'Pear', 'Beans'],
    farmingMethod: 'Organic',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=800&q=80',
    phone: '+91 96520 11223',
    bio: 'High-altitude produce grown with naturally rich soil and rain-fed irrigation.'
  },
  {
    name: 'Lakshmi Nair',
    email: 'lakshmi@agriconnect.com',
    password: 'Farmer123!',
    role: 'farmer',
    farmName: 'Nair Organic Fields',
    location: 'Thrissur',
    cropTypes: ['Rice', 'Banana', 'Coconut'],
    farmingMethod: 'Organic',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    phone: '+91 98712 34111',
    bio: 'Growing staple grains and tropical produce with eco-friendly methods.'
  },
  {
    name: 'Prakash Rao',
    email: 'prakash@agriconnect.com',
    password: 'Farmer123!',
    role: 'farmer',
    farmName: 'Praan Farm',
    location: 'Vijayawada',
    cropTypes: ['Mango', 'Chili', 'Turmeric'],
    farmingMethod: 'Conventional',
    isVerified: false,
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    phone: '+91 98440 99801',
    bio: 'Focused on climate-tolerant fruit and spice cultivation.'
  },
  {
    name: 'Anitha Selvam',
    email: 'anitha@agriconnect.com',
    password: 'Farmer123!',
    role: 'farmer',
    farmName: 'Selvam Dairy & Greens',
    location: 'Madurai',
    cropTypes: ['Milk', 'Spinach', 'Lettuce'],
    farmingMethod: 'Organic',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    phone: '+91 94444 32189',
    bio: 'Combining dairy and green leafy vegetables for fresh daily supply.'
  },
  {
    name: 'Mohan Babu',
    email: 'mohan@agriconnect.com',
    password: 'Farmer123!',
    role: 'farmer',
    farmName: 'Bharat Grain Works',
    location: 'Nagpur',
    cropTypes: ['Wheat', 'Millet', 'Maize'],
    farmingMethod: 'Conventional',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    phone: '+91 98333 77810',
    bio: 'Delivering quality grains and staple produce to local markets.'
  }
];

const sampleConsumers = [
  {
    name: 'Aarav Mehta',
    email: 'aarav@agriconnect.com',
    password: 'Consumer123!',
    role: 'consumer',
    location: 'Bengaluru',
    profileImage: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80',
    phone: '+91 91234 56780'
  },
  {
    name: 'Nisha Iyer',
    email: 'nisha@agriconnect.com',
    password: 'Consumer123!',
    role: 'consumer',
    location: 'Chennai',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    phone: '+91 99220 11122'
  },
  {
    name: 'Admin User',
    email: 'admin@agriconnect.com',
    password: 'Admin123!',
    role: 'admin',
    location: 'Hyderabad',
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
    phone: '+91 99887 66554'
  }
];

const sampleProducts = [
  {
    name: 'Organic Red Tomatoes',
    category: 'Vegetables',
    price: 48,
    unit: 'kg',
    stock: 90,
    availability: true,
    harvestDate: '2026-09-08',
    farmer: 'Ramesh Kumar',
    location: 'Coimbatore',
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=80',
    description: 'Farm-fresh, juicy red tomatoes grown with compost-enriched soil.'
  },
  {
    name: 'Fresh Spinach Bunch',
    category: 'Vegetables',
    price: 32,
    unit: 'bundle',
    stock: 120,
    availability: true,
    harvestDate: '2026-09-04',
    farmer: 'Anitha Selvam',
    location: 'Madurai',
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
    description: 'Tender leafy spinach harvested early morning for maximum freshness.'
  },
  {
    name: 'Crisp Carrots',
    category: 'Vegetables',
    price: 35,
    unit: 'kg',
    stock: 60,
    availability: true,
    harvestDate: '2026-09-03',
    farmer: 'Ramesh Kumar',
    location: 'Coimbatore',
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=800&q=80',
    description: 'Sweet, crunchy carrots with a bright orange color and rich flavor.'
  },
  {
    name: 'Mountain Apples',
    category: 'Fruits',
    price: 120,
    unit: 'kg',
    stock: 40,
    availability: true,
    harvestDate: '2026-09-05',
    farmer: 'Sundaram Iyer',
    location: 'Ooty',
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80',
    description: 'Sweet and crisp apples from the cool mountain orchards.'
  },
  {
    name: 'Golden Mangoes',
    category: 'Fruits',
    price: 140,
    unit: 'kg',
    stock: 55,
    availability: true,
    harvestDate: '2026-09-02',
    farmer: 'Prakash Rao',
    location: 'Vijayawada',
    isOrganic: false,
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
    description: 'Delicious ripe mangoes with a naturally rich and juicy taste.'
  },
  {
    name: 'Farm Fresh Bananas',
    category: 'Fruits',
    price: 56,
    unit: 'dozen',
    stock: 80,
    availability: true,
    harvestDate: '2026-09-06',
    farmer: 'Lakshmi Nair',
    location: 'Thrissur',
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
    description: 'Naturally ripened banana bunches from tropical groves.'
  },
  {
    name: 'Fresh Cow Milk',
    category: 'Dairy',
    price: 42,
    unit: 'litre',
    stock: 94,
    availability: true,
    harvestDate: '2026-09-07',
    farmer: 'Anitha Selvam',
    location: 'Madurai',
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
    description: 'Pure, nutrient-rich milk sourced from healthy dairy cattle.'
  },
  {
    name: 'Organic Ghee',
    category: 'Dairy',
    price: 320,
    unit: 'jar',
    stock: 35,
    availability: true,
    harvestDate: '2026-09-01',
    farmer: 'Anitha Selvam',
    location: 'Madurai',
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1628088308566-5f8c6d2d6d4d?auto=format&fit=crop&w=800&q=80',
    description: 'Slow-churned homemade ghee with a rich aroma and excellent texture.'
  },
  {
    name: 'Whole Wheat Grain',
    category: 'Grains',
    price: 58,
    unit: 'kg',
    stock: 110,
    availability: true,
    harvestDate: '2026-08-28',
    farmer: 'Mohan Babu',
    location: 'Nagpur',
    isOrganic: false,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    description: 'High-quality wheat harvested from fertile fields and lightly milled.'
  },
  {
    name: 'Organic Rice',
    category: 'Grains',
    price: 62,
    unit: 'kg',
    stock: 75,
    availability: true,
    harvestDate: '2026-09-09',
    farmer: 'Lakshmi Nair',
    location: 'Thrissur',
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80',
    description: 'Aromatic, naturally grown rice with soft grains and exceptional taste.'
  },
  {
    name: 'Fresh Lettuce',
    category: 'Vegetables',
    price: 28,
    unit: 'head',
    stock: 60,
    availability: true,
    harvestDate: '2026-09-02',
    farmer: 'Anitha Selvam',
    location: 'Madurai',
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1555804736-98d3f209f4fa?auto=format&fit=crop&w=800&q=80',
    description: 'Leafy lettuce harvested fresh for salads and healthy meals.'
  },
  {
    name: 'Turmeric Roots',
    category: 'Vegetables',
    price: 80,
    unit: 'kg',
    stock: 45,
    availability: true,
    harvestDate: '2026-09-01',
    farmer: 'Prakash Rao',
    location: 'Vijayawada',
    isOrganic: false,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    description: 'Fresh turmeric with an earthy aroma and strong medicinal value.'
  }
];

const createSampleData = async () => {
  try {
    const farmerCount = await Farmer.countDocuments();
    if (farmerCount === 0) {
      const farmers = await Farmer.insertMany(sampleFarmers);
      const farmerMap = new Map();
      farmers.forEach((farmer) => {
        farmerMap.set(farmer.name, farmer._id);
      });

      const consumerCount = await Consumer.countDocuments();
      if (consumerCount === 0) {
        await Consumer.insertMany(sampleConsumers);
      }

      const productData = sampleProducts.map((product) => ({
        ...product,
        farmer: farmerMap.get(product.farmer),
      }));

      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        const insertedProducts = await Product.insertMany(productData);

        const consumerDoc = await Consumer.findOne({ role: 'consumer' }).lean();
        if (consumerDoc && insertedProducts.length > 0) {
          const orderProducts = insertedProducts.slice(0, 2).map((item) => ({
            product: item._id,
            quantity: 2,
            price: item.price,
          }));

          const totalAmount = orderProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);

          await Order.create({
            consumer: consumerDoc._id,
            items: orderProducts,
            totalAmount,
            deliverySlot: '2026-09-12 10:00 AM - 12:00 PM',
            status: 'Placed',
          });

          const farmerDoc = await Farmer.findOne({ role: 'farmer' }).lean();
          if (farmerDoc) {
            await Order.create({
              consumer: consumerDoc._id,
              items: [
                {
                  product: insertedProducts[2]._id,
                  quantity: 1,
                  price: insertedProducts[2].price,
                },
              ],
              totalAmount: insertedProducts[2].price,
              deliverySlot: '2026-09-11 2:00 PM - 4:00 PM',
              status: 'Confirmed',
            });

            await Order.create({
              consumer: consumerDoc._id,
              items: [
                {
                  product: insertedProducts[5]._id,
                  quantity: 3,
                  price: insertedProducts[5].price,
                },
              ],
              totalAmount: insertedProducts[5].price * 3,
              deliverySlot: '2026-09-10 8:00 AM - 10:00 AM',
              status: 'Delivered',
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Sample data creation failed:', error.message);
  }
};

const startServer = async () => {
  const dbConnected = await connectDB();

  if (dbConnected) {
    await createSampleData();
  }

  app.listen(PORT, () => {
    console.log(`AgriConnect server running on http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;
