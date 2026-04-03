const FinancialRecord = require('../models/financialRecord.model');
const ApiError = require('../utils/ApiError');

// Create a financial record for a given user.
const createRecord = async ({ createdBy, amount, type, category, date, description }) => {
  const record = await FinancialRecord.create({
    createdBy,
    amount,
    type,
    category,
    date,
    description,
  });
  return record;
};

// Update an existing record (soft-deleted records cannot be updated).
const updateRecord = async (id, { amount, type, category, date, description, updatedBy }) => {
  const record = await FinancialRecord.findOne({ _id: id, isDeleted: false });
  if (!record) {
    throw new ApiError(404, 'Record not found');
  }

  if (amount !== undefined) record.amount = amount;
  if (type !== undefined) record.type = type;
  if (category !== undefined) record.category = category;
  if (date !== undefined) record.date = date;
  if (description !== undefined) record.description = description;
  if (updatedBy) record.updatedBy = updatedBy;

  await record.save();
  return record;
};

// Soft delete a record.
const deleteRecord = async (id, { updatedBy }) => {
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true, updatedBy } },
    { new: true }
  );

  if (!record) {
    throw new ApiError(404, 'Record not found');
  }

  return record;
};

// Build a Mongo filter based on allowed query parameters.
const buildRecordFilter = ({ type, category, startDate, endDate, minAmount, maxAmount, createdBy }) => {
  const filter = { isDeleted: false };

  if (createdBy) {
    filter.createdBy = createdBy;
  }

  if (type) filter.type = type;
  if (category) filter.category = category;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate) filter.date.$lte = endDate;
  }

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = minAmount;
    if (maxAmount) filter.amount.$lte = maxAmount;
  }

  return filter;
};

const listRecords = async ({
  type,
  category,
  startDate,
  endDate,
  minAmount,
  maxAmount,
  createdBy,
  page = 1,
  limit = 25,
}) => {
  const filter = buildRecordFilter({
    type,
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    createdBy,
  });

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    FinancialRecord.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FinancialRecord.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

const getRecordById = async (id) => {
  const record = await FinancialRecord.findOne({ _id: id, isDeleted: false }).lean();
  if (!record) {
    throw new ApiError(404, 'Record not found');
  }
  return record;
};

module.exports = {
  createRecord,
  updateRecord,
  deleteRecord,
  listRecords,
  getRecordById,
};
