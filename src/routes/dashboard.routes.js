const express = require('express');
const auth = require('../middleware/auth');
const requireRoles = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');
const dashboardController = require('../controllers/dashboard.controller');
const { summaryQuerySchema, recentActivityQuerySchema } = require('../validations/dashboard.validation');

const router = express.Router();

// Viewers, analysts, and admins can access dashboard-level aggregated data.
router.get(
  '/summary',
  auth,
  requireRoles(ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN),
  validate({ query: summaryQuerySchema }),
  dashboardController.getSummary
);

router.get(
  '/category-totals',
  auth,
  requireRoles(ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN),
  validate({ query: summaryQuerySchema }),
  dashboardController.getCategoryTotals
);

router.get(
  '/monthly-trends',
  auth,
  requireRoles(ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN),
  validate({ query: summaryQuerySchema }),
  dashboardController.getMonthlyTrends
);

router.get(
  '/recent-activity',
  auth,
  requireRoles(ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN),
  validate({ query: recentActivityQuerySchema }),
  dashboardController.getRecentActivity
);

module.exports = router;
