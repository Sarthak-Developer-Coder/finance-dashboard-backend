require('dotenv').config();

const app = require('./app');
const connectDb = require('./config/db');

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDb();

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Finance API listening on port ${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();
