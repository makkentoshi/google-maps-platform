const express = require('express');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {

  console.log("Safe mode health check was hit!");
  res.status(200).json({ status: "SAFE MODE IS OK", time: new Date().toISOString() });
});

app.post('/api/recognize', async (req, res) => {

    res.status(418).json({ message: "API is in safe mode. Problem is likely with ENV VARS." });
});

module.exports = app;