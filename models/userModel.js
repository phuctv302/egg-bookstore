const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please let us know your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide us your email'],
    validate: [validator.isEmail, 'Invalid email'],
    unique: [true, 'Email must be unique! Please choose another email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter your password!'],
    minlength: [8, 'Your password must have equal or more than 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please enter your password confirm'],
    minlength: [
      true,
      'Your password confirm must have equal or more than 8 characters',
    ],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// ENCRYPT USER PASSWORD
// ONLY WHEN SIGNING UP OR CHANGING PASSWORD
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // hash the password\
  this.password = await bcrypt.hash(this.password, 12);

  // remove passwordConfirm field
  this.passwordConfirm = undefined;

  next();
});

// INSTANCE METHOD
// CHECK CORRECT PASSWORD
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// CHECK USER CHANGED PASSWORD AFTER TOKEN WAS ISSUED
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    return parseInt(this.passwordChangedAt.getTime() / 1000, 10) > JWTTimestamp;
  }

  return false; // not changed
};

// CREATE A RANDOM PASSWORD RESET TOKEN
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// UPDATE PASSWORD CHANGED AT
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
