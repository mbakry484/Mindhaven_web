const { withExpo } = require('@expo/webpack-config');
const fs = require('fs');
const path = require('path');

module.exports = function (env, argv) {
  const config = withExpo({
    ...env,
    https: true,
  }, argv);

  // Add HTTPS configuration if in development mode
  if (config.devServer) {
    config.devServer.https = {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/private-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/certificate.pem')),
    };
    config.devServer.host = '0.0.0.0';
    config.devServer.port = 8443;
  }

  return config;
};
