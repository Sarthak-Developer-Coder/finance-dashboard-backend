const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');

// POST /api/users
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
});

// GET /api/users
const listUsers = catchAsync(async (req, res) => {
  const result = await userService.listUsers(req.query);
  res.status(200).json({ success: true, data: result.items, meta: result.pagination });
});

// GET /api/users/:id
const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

// PATCH /api/users/:id
const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ success: true, data: user });
});

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
};
