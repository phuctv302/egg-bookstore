const mongoose = require('mongoose');
const mongooseSimpleRandom = require('mongoose-simple-random');
const slugify = require('vietnamese-slug');

const bookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A book must have a name!'],
    trim: true,
    unique: [true, 'Name of book must be unique!'],
  },
  slug: String,
  image: {
    type: String,
    required: [true, 'A book must have an image'],
  },
  description: String,
  publisher: String,
  author: String,
  price: {
    type: Number,
    required: [true, 'A book must have price!'],
  },
  priceDiscount: {
    type: String,
    validate: {
      validator: function (val) {
        return val < this.price;
      },
      message: 'Price discount ({VALUE}) must be less than regular price!',
    },
  },
});

/* INDEX */
bookSchema.index({ slug: 1 });

// DOCUMENT MIDDLEWARE:
// SET PRICE DISCOUNT = 20% PRICE OF A BOOK
// SET SLUG FOR BOOK
bookSchema.pre('save', function (next) {
  if (this.isNew) {
    this.priceDiscount = this.price * 0.8;
    this.slug = slugify(this.name);
  }

  next();
});

bookSchema.plugin(mongooseSimpleRandom);
const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
