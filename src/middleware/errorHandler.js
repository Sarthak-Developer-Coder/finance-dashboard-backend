const ApiError = require('../utils/ApiError');

// Global error handler
// Ensures consistent error responses and hides internal details.
// In a real app, integrate a logger instead of console.error.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // eslint-disable-next-line no-console
  if (statusCode >= 500) console.error(err);

  const response = {
    success: false,
    message,
  };

  if (err.details) {
    response.details = err.details;
  }

  // Handle Joi validation errors
  if (err.isJoi) {
    response.message = 'Validation error';
    response.details = err.details?.map((d) => d.message) || [];
    return res.status(400).json(response);
  }

  // Handle Mongoose bad ObjectId casting
  if (err.name === 'CastError') {
    response.message = 'Invalid identifier supplied';
    return res.status(400).json(response);
  }

  return res.status(statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
