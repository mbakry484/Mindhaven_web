const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add HTTPS configuration for development server
config.server = {
  ...config.server,
  https: {
    key: fs.readFileSync(path.resolve(__dirname, 'ssl/private-key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'ssl/certificate.pem')),
  },
  port: 8443,
};

module.exports = config; 