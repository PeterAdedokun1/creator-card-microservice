'use strict';

require('dotenv').config();

const express = require('express');
const connectDB = require('./src/config/db');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(express.json());

app.use(routes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
