const Joi = require('joi');

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().max(80).required(),
  date: Joi.date().iso().required(),
  description: Joi.string().max(1000).allow('', null),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive(),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().max(80),
  date: Joi.date().iso(),
  description: Joi.string().max(1000).allow('', null),
}).min(1);

const listRecordsSchema = Joi.object({
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().max(80),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  minAmount: Joi.number().positive(),
  maxAmount: Joi.number().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
  listRecordsSchema,
};
