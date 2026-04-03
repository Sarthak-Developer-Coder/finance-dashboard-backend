const mongoose = require('mongoose');
const FinancialRecord = require('../models/financialRecord.model');

// Shared match stage to avoid duplicating filter logic in each aggregation.
const buildMatchStage = ({ startDate, endDate, createdBy }) => {
  const match = { isDeleted: false };

  if (createdBy) {
    match.createdBy = new mongoose.Types.ObjectId(createdBy);
  }

  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = startDate;
    if (endDate) match.date.$lte = endDate;
  }

  return match;
};

// Compute high-level summary metrics.
const getSummary = async (params) => {
  const match = buildMatchStage(params);

  const [result] = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpense = 0;

  if (result) {
    // In this simple example, we only get one aggregation result per type.
  }

  const allByType = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  for (const row of allByType) {
    if (row._id === 'income') totalIncome = row.totalAmount;
    if (row._id === 'expense') totalExpense = row.totalAmount;
  }

  const netBalance = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netBalance,
  };
};

// Category-wise aggregation for charting.
const getCategoryTotals = async (params) => {
  const match = buildMatchStage(params);

  const rows = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        type: '$_id.type',
        totalAmount: 1,
      },
    },
    { $sort: { category: 1, type: 1 } },
  ]);

  return rows;
};

// Monthly trend aggregation.
const getMonthlyTrends = async (params) => {
  const match = buildMatchStage(params);

  const rows = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        type: '$_id.type',
        totalAmount: 1,
      },
    },
    { $sort: { year: 1, month: 1, type: 1 } },
  ]);

  return rows;
};

// Recent activity listing for dashboard widgets.
const getRecentActivity = async (params, { limit = 10 }) => {
  const match = buildMatchStage(params);

  const items = await FinancialRecord.find(match)
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return items;
};

module.exports = {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
};
