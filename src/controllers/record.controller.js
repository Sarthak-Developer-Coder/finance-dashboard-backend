const recordService = require('../services/record.service');
const catchAsync = require('../utils/catchAsync');

// POST /api/records
const createRecord = catchAsync(async (req, res) => {
  const payload = {
    ...req.body,
    createdBy: req.user.id,
  };
  const record = await recordService.createRecord(payload);
  res.status(201).json({ success: true, data: record });
});

// GET /api/records
const listRecords = catchAsync(async (req, res) => {
  const query = {
    ...req.query,
    // For non-admin roles you could restrict to own records here.
  };
  const result = await recordService.listRecords(query);
  res.status(200).json({ success: true, data: result.items, meta: result.pagination });
});

// GET /api/records/:id
const getRecordById = catchAsync(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);
  res.status(200).json({ success: true, data: record });
});

// PATCH /api/records/:id
const updateRecord = catchAsync(async (req, res) => {
  const record = await recordService.updateRecord(req.params.id, {
    ...req.body,
    updatedBy: req.user.id,
  });
  res.status(200).json({ success: true, data: record });
});

// DELETE /api/records/:id
const deleteRecord = catchAsync(async (req, res) => {
  const record = await recordService.deleteRecord(req.params.id, { updatedBy: req.user.id });
  res.status(200).json({ success: true, data: record });
});

module.exports = {
  createRecord,
  listRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
