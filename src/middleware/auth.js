const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const ApiError = require('../utils/ApiError');

// Authenticate user via Bearer token and attach minimal user context to request.
const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

    if (!token) {
      throw new ApiError(401, 'Authentication token missing');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

    const user = await User.findById(payload.sub).select('+passwordHash').populate('role');

    if (!user) {
      throw new ApiError(401, 'User not found for provided token');
    }

    if (user.status !== 'active') {
      throw new ApiError(403, 'User is not active');
    }

    // Attach limited user context; avoid exposing passwordHash
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role?.name,
      roleId: user.role?._id,
    };

    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired authentication token'));
    }
    return next(err);
  }
};

module.exports = auth;
