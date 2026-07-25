// HTTP utilities — request parsing and response helpers

const crypto = require('crypto');

function sendJson(response, statusCode, data) {
  const body = JSON.stringify(data);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Request-Id': crypto.randomUUID().slice(0, 8),
    'X-Axiom-Version': '2.0.0'
  });
  response.end(body);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        request.destroy(new Error('Request body too large'));
        reject(new Error('Invalid JSON body'));
      }
    });
    request.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    request.on('error', () => reject(new Error('Invalid JSON body')));
  });
}

module.exports = { sendJson, readJson };