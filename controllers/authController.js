const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const User = require('../models/userModel');

// SIGN A NEW TOKEN
const signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  return token;
};

// CREATE AND SEND TOKEN TO CLIENT (VIA COOKIE)
const createSendToken = (user, statusCode, req, res) => {
  // sign token
  const token = signToken(user._id);

  // cookie option
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ), // in 90 days
  };

  // send token via cookie
  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;

  // send token to client
  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

// SIGN UP
exports.signup = catchAsync(async (req, res, next) => {
  // create new user from body
  const newUser = await User.create(req.body);

  // encrypt password before saving (do in model)

  // create and send token to client
  createSendToken(newUser, 201, req, res);
});

// LOGIN
exports.login = catchAsync(async (req, res, next) => {
  // get data from body
  const { email, password } = req.body;

  // check invalid email or password
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password!', 400));

  // create and send token
  createSendToken(user, 200, req, res);
});

// LOG OUT
exports.logout = (req, res, next) => {
  res.cookie('jwt', 'logged out!', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};

// PROTECT ROUTES
exports.protect = catchAsync(async (req, res, next) => {
  // Get token from header or cookie
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // Check token valid
  if (!token)
    return next(
      new AppError('User has not logged in yet. Please login to continue!', 401)
    );

  // decode token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // check user belong to this token exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belong to the token no longer exists.', 401)
    );

  // check token was issued after password was changed
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password. Please login again', 401)
    );

  // let user access routes
  req.user = currentUser;
  req.locals = currentUser;

  next();
});

// CHECK USER IS LOGGED IN OR NOT
// TO DISPLAY LOGIN BUTTON OR USER'S AVATAR
exports.isLoggedIn = async (req, res, next) => {
  try {
    // Get the token
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) return next();

    // decode token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check user exists
    const currentUser = await User.findOne({ _id: decoded.id });
    if (!currentUser) return next();

    // Check user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) return next();

    // OK! user has logged in
    res.locals.user = currentUser;
    res.user = currentUser;

    return next();
  } catch (err) {
    next();
  }
};

/**
 * FORGOT AND RESET PASSWORD
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get email from input
  const { email } = req.body;

  // Check there is a user belong to the email
  const user = await User.findOne({ email });
  if (!user)
    return next(new AppError('There is no user belong to the email!', 404));

  // Send email along with the resetToken
  try {
    // Create a random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/reset-password/${resetToken}`;

    new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. Try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get data input
  const { password, passwordConfirm } = req.body;

  // Get token param
  const { token } = req.params;

  // Hashed token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Check valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Token is invalid or is expired!', 400));

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // log user in, send jwt
  createSendToken(user, 200, req, res);

  next();
});

/**
 * UPDATE PASSWORD FOR CURRENT USER
 */
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  // get current pass, new pass, confirm new pass value
  const { passwordCurrent, password, passwordConfirm } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.correctPassword(passwordCurrent, user.password)))
    return next(new AppError('Current password is wrong!', 401));

  // Update user password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // issue new token
  createSendToken(user, 200, req, res);
});
