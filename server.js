const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

// Connect to DB
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log('DB connection successfully!'));

// Run app
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`App is running on port ${port} - ${process.env.NODE_ENV}`)
);

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVE. Shutting down gracfully!');

  // close server, but before that it handle all the pending request
  server.close(() => {
    console.log(`💥 Process terminated!`);
  });
});
