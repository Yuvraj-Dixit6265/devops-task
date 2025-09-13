const express = require('express');
const path = require('path');

const app = express();

// return the PNG at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'logoswayatt.png'));
});

const PORT = process.env.PORT || 8080;      // Cloud Run sets PORT=8080
app.listen(PORT, '0.0.0.0', () => {         // bind 0.0.0.0 for Docker/Cloud Run
  console.log(`Server listening on port ${PORT}`);
});
