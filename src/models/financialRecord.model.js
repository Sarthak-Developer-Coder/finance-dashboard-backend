const mongoose = require('mongoose');

const financialRecordSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Optimized queries for dashboard analytics and listing
financialRecordSchema.index({ createdBy: 1, date: -1 });
financialRecordSchema.index({ createdBy: 1, category: 1 });
financialRecordSchema.index({ createdBy: 1, type: 1, date: -1 });

module.exports = mongoose.model('FinancialRecord', financialRecordSchema);
