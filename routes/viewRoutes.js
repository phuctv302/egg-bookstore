const express = require('express');

const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn);

router.get('/', viewController.getOverview);
router.get('/books/book/:slug', viewController.getBookDetail);

router.get('/login', viewController.getLoginForm);
router.get('/signup', viewController.getSignupForm);
router.get('/forgot-password', viewController.getForgotPasswordForm);
router.get('/reset-password/:resetToken', viewController.getResetPasswordForm);

router.get('/my-profile', authController.protect, viewController.getAccount);

module.exports = router;
