const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Book = require('../models/bookModel');

dotenv.config({ path: './config.env' });

// Get data from json file
const books = JSON.parse(fs.readFileSync(`${__dirname}/books.json`, 'utf-8'));

// Connect to DB
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successfully!'));

// Import function
const importData = async () => {
  try {
    await Book.create(books);

    console.log('Import data successfully!');
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

// Delete function
const deleteData = async () => {
  try {
    await Book.deleteMany();

    console.log('Delete data successfully!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Execute function
if (process.argv[2] === '--delete') {
  deleteData();
} else {
  importData();
}
