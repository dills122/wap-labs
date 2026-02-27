const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[gateway-request] ${new Date().toISOString()} ${req.method} ${req.originalUrl} ua=\"${req.get('user-agent') || ''}\" ip=${req.ip}`);
  next();
});

function sendWml(res, fileName) {
  const filePath = path.join(__dirname, 'routes', fileName);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).type('text/plain').send('Unable to load WML page');
      return;
    }

    res.set('Content-Type', 'text/vnd.wap.wml; charset=utf-8');
    res.send(data);
  });
}

app.get('/', (req, res) => {
  sendWml(res, 'index.wml');
});

app.get('/login', (req, res) => {
  sendWml(res, 'login.wml');
});

app.post('/login', (req, res) => {
  sendWml(res, 'login.wml');
});

app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'viewer.html'));
});

app.listen(port, () => {
  console.log(`WML server listening on port ${port}`);
});
