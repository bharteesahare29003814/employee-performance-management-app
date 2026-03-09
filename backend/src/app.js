const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./routes');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/employees', employeeRoutes);

  // Global error handler
  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
