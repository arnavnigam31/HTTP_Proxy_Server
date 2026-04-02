/**
 * ProxyX Bridge Server
 * ─────────────────────────────────────────────────────────────
 * This tiny Express server sits between the browser frontend
 * and your C proxy. The browser can't directly use an HTTP
 * proxy via fetch(), so this bridge does it for you:
 *
 *   Browser  →  GET /fetch?url=http://...
 *            →  Bridge sends request THROUGH your C proxy
 *            →  Returns { ok, html, bytes, cache, time }
 *
 * Usage:
 *   npm install express http node-fetch cors
 *   node server.js [proxy_port] [bridge_port]
 *
 * Defaults:
 *   Proxy  on port 8080
 *   Bridge on port 3000
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express');
const http    = require('http');
const path    = require('path');
const cors    = require('cors');

const PROXY_HOST  = '127.0.0.1';
const PROXY_PORT  = parseInt(process.argv[2]) || 8080;
const BRIDGE_PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname))); // serve index.html

// ── /fetch endpoint ──────────────────────────────────────────
app.head('/', (req, res) => {
  res.status(200).end();
});
app.get('/fetch', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.json({ ok: false, error: 'Missing ?url= parameter' });
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return res.json({ ok: false, error: 'Invalid URL: ' + targetUrl });
  }

  if (parsed.protocol !== 'http:') {
    return res.json({ ok: false, error: 'Only http:// URLs are supported (your C proxy handles HTTP/1.0)' });
  }

  const startTime = Date.now();

  // Build a raw HTTP/1.0 GET request — exactly what the C proxy expects
  const rawRequest =
    `GET ${targetUrl} HTTP/1.0\r\n` +
    `Host: ${parsed.hostname}\r\n` +
    `Connection: close\r\n` +
    `\r\n`;

  // Connect directly to the C proxy's TCP socket
  const socket = new (require('net').Socket)();
  let rawResponse = Buffer.alloc(0);
  let connected = false;

  socket.setTimeout(15000);

  socket.connect(PROXY_PORT, PROXY_HOST, () => {
    connected = true;
    console.log(`[>] ${targetUrl}`);
    socket.write(rawRequest);
  });

  socket.on('data', chunk => {
    rawResponse = Buffer.concat([rawResponse, chunk]);
  });

  socket.on('timeout', () => {
    socket.destroy();
    if (!res.headersSent)
      res.json({ ok: false, error: `Proxy timed out (is ./proxy ${PROXY_PORT} running?)` });
  });

  socket.on('error', err => {
    if (!res.headersSent)
      res.json({ ok: false, error: `Cannot connect to proxy on port ${PROXY_PORT}: ${err.message}` });
  });

  socket.on('close', () => {
    if (!connected || res.headersSent) return;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
    const raw = rawResponse.toString('utf8', 0, rawResponse.length);

    // Split HTTP response headers from body
    const headerEnd = raw.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      return res.json({ ok: false, error: 'Malformed response from proxy' });
    }

    const headerSection = raw.slice(0, headerEnd);
    const html = raw.slice(headerEnd + 4);

    // Parse status line
    const statusLine = headerSection.split('\r\n')[0];
    const statusCode = parseInt(statusLine.split(' ')[1]) || 0;

    // Detect cache header (your C proxy prints HIT/MISS to stdout,
    // but you could add an X-Cache header to the C code — for now we infer)
    const isHit = elapsed < '0.010'; // rough heuristic; add X-Cache header for accuracy

    console.log(`[${isHit ? 'HIT ' : 'MISS'}] ${statusCode} ${targetUrl} — ${elapsed}s, ${rawResponse.length} bytes`);

    res.json({
      ok:    statusCode >= 200 && statusCode < 600,
      html:  html,
      bytes: rawResponse.length,
      cache: isHit ? 'HIT' : 'MISS',
      status: statusCode,
      time:  elapsed,
    });
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(BRIDGE_PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║        ProxyX Bridge Server          ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log(`  ║  Frontend  →  http://localhost:${BRIDGE_PORT}   ║`);
  console.log(`  ║  C Proxy   →  localhost:${PROXY_PORT}           ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  Make sure your C proxy is running:`);
  console.log(`    ./proxy ${PROXY_PORT}`);
  console.log('');
});
