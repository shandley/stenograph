#!/usr/bin/env node
/**
 * Steno Flow Server
 *
 * A lightweight WebSocket server that relays Claude Code hook events
 * to the steno-flow visualization in real-time.
 *
 * Usage:
 *   node .steno/flow-server.js
 *
 * Or with npx (no install needed):
 *   npx -y node .steno/flow-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 3847;
const clients = new Set();

// Activity tracking
let recentEvents = [];
const MAX_RECENT = 50;

// Get the .steno directory path
const stenoDir = __dirname;

// Create HTTP server for receiving hook POSTs
const httpServer = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve flow.html at root
  if (req.method === 'GET' && (req.url === '/' || req.url === '/flow')) {
    const htmlPath = path.join(stenoDir, 'flow.html');
    fs.readFile(htmlPath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('flow.html not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  // Serve session data (current-session.json transformed to graph format)
  if (req.method === 'GET' && req.url.startsWith('/graph.json')) {
    const sessionPath = path.join(stenoDir, 'current-session.json');
    fs.readFile(sessionPath, 'utf8', (err, content) => {
      if (err) {
        // Try legacy graph.json
        const graphPath = path.join(stenoDir, 'graph.json');
        fs.readFile(graphPath, 'utf8', (err2, graphContent) => {
          if (err2) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              version: "1.1",
              currentBranch: "main",
              branches: [{ name: "main", status: "active", nodes: [] }],
              sessions: [{ nodes: [] }]
            }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(graphContent);
        });
        return;
      }

      // Transform current-session.json to graph format
      try {
        const session = JSON.parse(content);
        const nodes = session.nodes || [];

        // Extract unique branches from nodes
        const branchMap = new Map();
        branchMap.set('main', { name: 'main', status: 'active', nodes: [] });

        nodes.forEach(n => {
          const branch = n.branch || 'main';
          if (!branchMap.has(branch)) {
            branchMap.set(branch, { name: branch, status: 'active', nodes: [] });
          }
          branchMap.get(branch).nodes.push(n.id);
        });

        const graphData = {
          version: "1.1",
          currentBranch: "main",
          branches: Array.from(branchMap.values()),
          sessions: [{ id: session.id, nodes: nodes }]
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(graphData));
      } catch (e) {
        console.error('Error parsing current-session.json:', e);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          version: "1.1",
          currentBranch: "main",
          branches: [{ name: "main", status: "active", nodes: [] }],
          sessions: [{ nodes: [] }]
        }));
      }
    });
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      clients: clients.size,
      recentEvents: recentEvents.length
    }));
    return;
  }

  // Get recent events (for reconnecting clients)
  if (req.method === 'GET' && req.url === '/recent') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(recentEvents));
    return;
  }

  // Event endpoint
  if (req.method === 'POST' && req.url === '/event') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const event = JSON.parse(body);

        // Add to recent events
        recentEvents.push(event);
        if (recentEvents.length > MAX_RECENT) {
          recentEvents.shift();
        }

        // Broadcast to all WebSocket clients
        const message = JSON.stringify(event);
        for (const client of clients) {
          if (client.readyState === 1) { // OPEN
            client.send(message);
          }
        }

        // Log
        const icon = event.type === 'pre' ? '→' : event.type === 'post' ? '✓' : '■';
        const target = event.target ? ` ${event.target.substring(0, 40)}` : '';
        console.log(`${icon} ${event.tool || 'stop'}${target}`);

        res.writeHead(200);
        res.end('ok');
      } catch (e) {
        console.error('Parse error:', e.message);
        res.writeHead(400);
        res.end('invalid json');
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

// Create WebSocket server
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  clients.add(ws);
  console.log(`+ Client connected (${clients.size} total)`);

  // Send recent events to new client
  ws.send(JSON.stringify({ type: 'init', events: recentEvents.slice(-10) }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`- Client disconnected (${clients.size} total)`);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    clients.delete(ws);
  });
});

// Handle port in use error
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Error: Port ${PORT} is already in use.\n`);
    console.error(`  To fix, run: lsof -ti:${PORT} | xargs kill -9\n`);
    process.exit(1);
  }
  throw err;
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ~ steno flow server ~                                   ║
║                                                           ║
║   Dashboard:      http://localhost:${PORT}                  ║
║   WebSocket:      ws://localhost:${PORT}                    ║
║   Events:         http://localhost:${PORT}/event            ║
║                                                           ║
║   Waiting for Claude Code hooks...                        ║
║                                                           ║
║   Press Ctrl+C to stop                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  for (const client of clients) {
    client.close();
  }
  httpServer.close(() => {
    process.exit(0);
  });
});
