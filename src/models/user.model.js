const mongoose = require('mongoose');
const { USER_STATUSES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      // Store hash, never raw password
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
