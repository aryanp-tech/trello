require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./db/db');

// Connect to MongoDB
connectDB();


app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});