const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'src', 'assets', 'images', 'ads');
http.createServer((req, res) => {
  const file = path.join(ROOT, req.url);
  if (fs.existsSync(file)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.end(fs.readFileSync(file));
  } else { res.writeHead(404); res.end('not found'); }
}).listen(7788, () => console.log('Ad server ready on http://localhost:7788'));
