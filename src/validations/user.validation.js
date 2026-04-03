const Joi = require('joi');
const { USER_STATUSES, ROLES } = require('../utils/constants');

const createUserSchema = Joi.object({
  name: Joi.string().max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  roleName: Joi.string()
    .valid(...Object.values(ROLES))
    .required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().max(120),
  roleName: Joi.string().valid(...Object.values(ROLES)),
  status: Joi.string().valid(...Object.values(USER_STATUSES)),
}).min(1);

const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
};
