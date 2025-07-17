const express = require('express');
const app = express();

app.get("/api/health", (req, res) => {
  res.status(200).json({ 
      status: "THIS IS THE TEST FROM 12:47, IT CANNOT FAIL" 
  });
});

module.exports = app;