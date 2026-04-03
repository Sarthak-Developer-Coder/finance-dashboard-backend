const express = require('express');
const auth = require('../middleware/auth');
const requireRoles = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');
const userController = require('../controllers/user.controller');
const { createUserSchema, updateUserSchema, listUsersSchema } = require('../validations/user.validation');

const router = express.Router();

// Admin-only user management
router.post(
  '/',
  auth,
  requireRoles(ROLES.ADMIN),
  validate({ body: createUserSchema }),
  userController.createUser
);

router.get(
  '/',
  auth,
  requireRoles(ROLES.ADMIN),
  validate({ query: listUsersSchema }),
  userController.listUsers
);

router.get(
  '/:id',
  auth,
  requireRoles(ROLES.ADMIN),
  userController.getUserById
);

router.patch(
  '/:id',
  auth,
  requireRoles(ROLES.ADMIN),
  validate({ body: updateUserSchema }),
  userController.updateUser
);

module.exports = router;
