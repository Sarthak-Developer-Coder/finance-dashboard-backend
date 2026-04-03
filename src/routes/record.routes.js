const express = require('express');
const auth = require('../middleware/auth');
const requireRoles = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');
const recordController = require('../controllers/record.controller');
const { createRecordSchema, updateRecordSchema, listRecordsSchema } = require('../validations/record.validation');

const router = express.Router();

// Records listing and detail: analyst and admin can see full records.
router.get(
  '/',
  auth,
  requireRoles(ROLES.ANALYST, ROLES.ADMIN),
  validate({ query: listRecordsSchema }),
  recordController.listRecords
);

router.get(
  '/:id',
  auth,
  requireRoles(ROLES.ANALYST, ROLES.ADMIN),
  recordController.getRecordById
);

// Mutations: admin only.
router.post(
  '/',
  auth,
  requireRoles(ROLES.ADMIN),
  validate({ body: createRecordSchema }),
  recordController.createRecord
);

router.patch(
  '/:id',
  auth,
  requireRoles(ROLES.ADMIN),
  validate({ body: updateRecordSchema }),
  recordController.updateRecord
);

router.delete(
  '/:id',
  auth,
  requireRoles(ROLES.ADMIN),
  recordController.deleteRecord
);

module.exports = router;
