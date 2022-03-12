const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const viewRouter = require('./routes/viewRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// TELL APP TO USE PUG ENGINE
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files in public folder
app.use(express.static(path.join(__dirname, 'public')));

/**
 * MIDDLEWARE
 */
// LOG REQUEST DETAIL IN DEV ENV
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// BODY PARSER
app.use(express.json());

// COOKIE PARSER
app.use(cookieParser());

// COMPRESS ALL TEXT
app.use(compression());

/**
 * ROUTES
 */
app.use('/api/v1/users', userRouter);
app.use('/', viewRouter);

// HANDLE UNHANDLED ROUTE
app.use('*', (req, res, next) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  return next(new AppError(message, 404));
});

// HANDLER ERROR MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
