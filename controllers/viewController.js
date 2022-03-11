const catchAsync = require('../utils/catchAsync');

const Book = require('../models/bookModel');

// RENDER OVERVIEW PAGE (RANDOM BOOKS)
exports.getOverview = catchAsync(async (req, res, next) => {
  // get all books
  const books = await Book.find();

  // Get book by category to display in home page
  const stats = await Book.aggregate([
    {
      $facet: {
        mostFamousBook: [{ $sample: { size: 1 } }],
        newBooks: [{ $sample: { size: 8 } }],
        saleBooks: [{ $sample: { size: 4 } }],
        bestSellBooks: [{ $sample: { size: 4 } }],
      },
    },
  ]);

  res.status(200).render('overview', {
    title: 'Welcome to Egg Book Store',
    books,
    mostFamousBook: stats[0].mostFamousBook[0],
    newBooks: stats[0].newBooks,
    saleBooks: stats[0].saleBooks,
    bestSellBooks: stats[0].bestSellBooks,
  });
});

exports.getBookDetail = catchAsync(async (req, res, next) => {
  const { slug } = req.params;

  const book = await Book.findOne({ slug });

  res.status(200).render('book', {
    title: book.name,
    book,
  });
});

// ACCOUNT PAGE
exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
});

/**
 * AUTHORIZATION
 */
exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login to your account!',
  });
};

exports.getSignupForm = (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Sign up new account',
  });
};

exports.getForgotPasswordForm = (req, res, next) => {
  res.status(200).render('forgotPassword', {
    title: 'Forgot your password!',
  });
};

exports.getResetPasswordForm = (req, res, next) => {
  const { resetToken } = req.params;

  res.status(200).render('resetPassword', {
    title: 'Reset your password!',
    resetToken,
  });
};
