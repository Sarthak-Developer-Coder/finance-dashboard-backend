const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

const JWT_EXPIRES_IN = '8h';

// Create initial admin user if none exists (for local setup convenience).
const ensureDefaultAdmin = async () => {
  const existingAdminRole = await Role.findOne({ name: ROLES.ADMIN });
  let adminRole = existingAdminRole;

  if (!adminRole) {
    adminRole = await Role.create({
      name: ROLES.ADMIN,
      description: 'System administrator with full access',
      permissions: ['users:manage', 'records:manage', 'analytics:view'],
    });
  }

  const existingAdmin = await User.findOne({ email: 'admin@example.com' }).lean();

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Default Admin',
      email: 'admin@example.com',
      passwordHash,
      role: adminRole._id,
    });
  }
};

// Authenticate user by email/password and issue JWT.
const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash').populate('role');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'User is not active');
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role?.name,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: JWT_EXPIRES_IN }
  );

  await User.updateOne({ _id: user.id }, { $set: { lastLoginAt: new Date() } });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
      status: user.status,
    },
  };
};

module.exports = {
  ensureDefaultAdmin,
  login,
};
