const https = require('https');
const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const HTTPS_PORT = 8443;
const EXPO_PORT = 8081; // Default Expo dev server port

// SSL certificate paths
const privateKey = fs.readFileSync(path.join(__dirname, 'ssl/private-key.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'ssl/certificate.pem'), 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate
};

// Create proxy middleware
const proxy = httpProxy.createProxyMiddleware({
  target: `http://localhost:${EXPO_PORT}`,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying for hot reload
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error');
  }
});

// Use the proxy for all requests
app.use('/', proxy);

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`HTTPS Proxy Server running on https://localhost:${HTTPS_PORT}`);
  console.log(`Proxying to Expo dev server on http://localhost:${EXPO_PORT}`);
  console.log(`External access: https://your-server-ip:${HTTPS_PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpsServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpsServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 