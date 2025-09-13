const express = require('express');
const path = require('path');

const app = express();

// Cloud Run expects your app to listen on process.env.PORT (defaults to 8080 here)
const PORT = process.env.PORT || 8080;

// Return the PNG at the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'logoswayatt.png'));
});

// Start server (bind to 0.0.0.0 so it’s reachable in Docker/Cloud Run)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
