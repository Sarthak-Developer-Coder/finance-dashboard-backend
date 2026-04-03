const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    permissions: {
      // Simple string identifiers for capabilities (e.g. 'records:read')
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
