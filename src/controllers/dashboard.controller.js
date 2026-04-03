const dashboardService = require('../services/dashboard.service');
const catchAsync = require('../utils/catchAsync');

// GET /api/dashboard/summary
const getSummary = catchAsync(async (req, res) => {
  const summary = await dashboardService.getSummary(req.query);
  res.status(200).json({ success: true, data: summary });
});

// GET /api/dashboard/category-totals
const getCategoryTotals = catchAsync(async (req, res) => {
  const rows = await dashboardService.getCategoryTotals(req.query);
  res.status(200).json({ success: true, data: rows });
});

// GET /api/dashboard/monthly-trends
const getMonthlyTrends = catchAsync(async (req, res) => {
  const rows = await dashboardService.getMonthlyTrends(req.query);
  res.status(200).json({ success: true, data: rows });
});

// GET /api/dashboard/recent-activity
const getRecentActivity = catchAsync(async (req, res) => {
  const { limit, ...rest } = req.query;
  const rows = await dashboardService.getRecentActivity(rest, { limit: Number(limit) || 10 });
  res.status(200).json({ success: true, data: rows });
});

module.exports = {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
};
