const mongoose = require('mongoose');

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  });

  // Optional: log only on initial connect in real apps, use a logger instead
  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB');
};

module.exports = connectDb;
