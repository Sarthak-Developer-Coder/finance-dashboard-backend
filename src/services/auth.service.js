const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

const JWT_EXPIRES_IN = '8h';

// Ensure core roles exist and create initial admin user if none exists.
const ensureDefaultAdmin = async () => {
  const roleDefinitions = [
    {
      name: ROLES.VIEWER,
      description: 'Viewer with read-only access to dashboard analytics',
      permissions: ['analytics:view'],
    },
    {
      name: ROLES.ANALYST,
      description: 'Analyst with read access to records and analytics',
      permissions: ['analytics:view', 'records:read'],
    },
    {
      name: ROLES.ADMIN,
      description: 'System administrator with full access',
      permissions: ['users:manage', 'records:manage', 'analytics:view'],
    },
  ];

  // Upsert core roles so creating users by role name is reliable.
  const roles = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const def of roleDefinitions) {
    // eslint-disable-next-line no-await-in-loop
    const role =
      (await Role.findOne({ name: def.name })) ||
      // eslint-disable-next-line no-await-in-loop
      (await Role.create(def));
    roles[def.name] = role;
  }

  const existingAdmin = await User.findOne({ email: 'admin@example.com' }).lean();

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Default Admin',
      email: 'admin@example.com',
      passwordHash,
      role: roles[ROLES.ADMIN]._id,
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
