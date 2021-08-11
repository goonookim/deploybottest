const http = require('http');
const port = process.env.PORT || 4141;

http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end("test server working");
}).listen(port);
console.info('SERVER WORKING ON PORT', port);
