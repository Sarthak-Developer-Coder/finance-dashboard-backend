const ApiError = require('../utils/ApiError');

// Role-based access control middleware factory.
// Usage: router.get('/path', auth, requireRoles('analyst', 'admin'), handler)
const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const hasRole = allowedRoles.includes(req.user.role);

  if (!hasRole) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }

  return next();
};

module.exports = requireRoles;
