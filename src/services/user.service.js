const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const ApiError = require('../utils/ApiError');

// Create a new user with a given role name.
const createUser = async ({ name, email, password, roleName }) => {
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const role = await Role.findOne({ name: roleName });
  if (!role) {
    throw new ApiError(400, 'Invalid role specified');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role._id,
  });

  return user;
};

const listUsers = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    User.find()
      .populate('role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(),
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

const getUserById = async (id) => {
  const user = await User.findById(id).populate('role').lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const updateUser = async (id, { name, roleName, status }) => {
  const update = {};
  if (name !== undefined) update.name = name;
  if (status !== undefined) update.status = status;

  if (roleName) {
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      throw new ApiError(400, 'Invalid role specified');
    }
    update.role = role._id;
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  ).populate('role');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
};
