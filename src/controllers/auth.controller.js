const { login, ensureDefaultAdmin } = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

// POST /api/auth/login
const loginHandler = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await login(email, password);
  res.status(200).json({ success: true, data: result });
});

// POST /api/auth/seed-admin (dev only)
const seedAdminHandler = catchAsync(async (req, res) => {
  await ensureDefaultAdmin();
  res.status(201).json({ success: true, message: 'Default admin ensured' });
});

module.exports = {
  loginHandler,
  seedAdminHandler,
};
