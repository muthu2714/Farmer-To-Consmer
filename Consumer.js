const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const consumerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['farmer', 'consumer', 'admin'],
      default: 'consumer',
    },
    location: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    },
    ratings: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        score: { type: Number, min: 1, max: 5 },
        review: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

consumerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('Consumer', consumerSchema);
