const Joi = require('joi');

const summaryQuerySchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
});

const recentActivityQuerySchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

module.exports = {
  summaryQuerySchema,
  recentActivityQuerySchema,
};
