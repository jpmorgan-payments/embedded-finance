const express = require('express');
const fs = require('fs');
const https = require('https');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const HttpsProxyAgent = require('https-proxy-agent');

const handleProxyResponse = async (responseBuffer, proxyRes, req) => {
  const exchange = `[${req.method}] [${proxyRes.statusCode}] ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path}`;
  console.log(exchange);
  if (proxyRes.headers['content-type'] === 'application/json') {
    const data = JSON.parse(responseBuffer.toString('utf8'));
    return JSON.stringify(data);
  }
  return responseBuffer;
};

const app = express();

// proxy middleware options
// we need to add corp proxy here
const options = {
  target: 'https://apigatewaycat.jpmorgan.com/tsapi/v1/eb', // target host with the same base path
  changeOrigin: true, // needed for virtual hosted sites
  selfHandleResponse: true,
  pathRewrite: {
    '^/api': '',
  },
  onProxyRes: responseInterceptor(handleProxyResponse),
  onError: (err) => {
    console.log(err);
  },
  agent: new https.Agent({
    key: fs.readFileSync('certs/jpmc.key'),
    cert: fs.readFileSync('certs/jpmc.crt'),
    passphrase: process.env.PASSPHRASE,
    rejectUnauthorized: false,
  }),
};

// create the proxy
const proxy = createProxyMiddleware(options);

// mount `exampleProxy` in web server
app.use('/api', proxy);

app.listen(8081);
