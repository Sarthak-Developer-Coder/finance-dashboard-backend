const Joi = require('joi');
const ApiError = require('../utils/ApiError');

// Generic request validation middleware using Joi schemas.
// Example: validate({ body: createUserSchema })
const validate = (schemas) => (req, res, next) => {
  try {
    const locations = Object.keys(schemas);

    for (const location of locations) {
      const schema = schemas[location];
      const data = req[location];
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        error.isJoi = true;
        throw error;
      }

      // Replace with validated/cleaned data
      // eslint-disable-next-line no-param-reassign
      req[location] = value;
    }

    return next();
  } catch (err) {
    if (err.isJoi) {
      return next(err);
    }
    return next(new ApiError(400, 'Invalid request payload'));
  }
};

module.exports = validate;
