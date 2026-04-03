const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (use more advanced logger in production)
app.use(morgan('dev'));

// API routes
app.use('/api', routes);

// 404 & error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
