const AppError = require('../utils/appError');

// HANDLE INVALID JWT ERROR
const handleInvalidJWTError = () => new AppError('Invalid token', 401);
const handleExpiredJWTError = () => new AppError('Token expired', 401);

// DUPLICATE FIELDS
const handleDuplicateFieldsError = (err) => {
  const values = Object.values(err.keyValue).join(', ');
  const message = `Duplicate fields value: ${values}. Please try another value!`;
  return new AppError(message, 400);
};

// VALIDATION ERROR DB
const handleValidationError = (err) => {
  const errors = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  const message = `Invalid input data: ${errors}`;
  return new AppError(message, 400);
};

// SEND ERROR IN DEV ENV
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errorName: err.name,
      error: err,
      stack: err.stack,
    });
  }

  // RENDER ERROR PAGE
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

// SEND ERROR IN PROD ENV
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational error => send error message
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Unhandled error => Log and Send generic message
    console.log('ERROR 💥: ', err);
    console.log('ERROR NAME 😒: ', err.name);

    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }

  // Render error page
  /// operational error
  if (err.isOperational)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });

  /// unhanled error
  console.log('ERROR 💥: ', err);
  console.log('ERROR NAME 😒: ', err.name);
  res.status(500).render('error', {
    title: 'Something went wrong!',
    msg: 'Something went wrong!',
  });
};

// ERROR HANDLER MIDDLEWARE
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.name = err.name;
  error.message = err.message;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (error.name === 'JsonWebTokenError') error = handleInvalidJWTError();
    if (error.name === 'TokenExpiredError') error = handleExpiredJWTError();
    if (error.code === 11000) error = handleDuplicateFieldsError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);

    sendErrorProd(error, req, res);
  }
};
