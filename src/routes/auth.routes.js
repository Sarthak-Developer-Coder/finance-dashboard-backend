const express = require('express');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validations/auth.validation');
const { loginHandler, seedAdminHandler } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', validate({ body: loginSchema }), loginHandler);

// Dev-only helper to seed default admin user and role.
if (process.env.NODE_ENV !== 'production') {
  router.post('/seed-admin', seedAdminHandler);
}

module.exports = router;
