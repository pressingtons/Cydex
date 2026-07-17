const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const dataDir = path.join(root, 'data');
const usersFile = path.join(dataDir, 'users.json');
const outboxFile = path.join(dataDir, 'email-outbox.json');
const sessions = new Map();
const mimeTypes = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

async function loadLocalEnv() {
  try {
    const contents = await fs.readFile(path.join(root, '.env'), 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
async function ensureDataFiles() { await fs.mkdir(dataDir, { recursive: true }); for (const file of [usersFile, outboxFile]) { try { await fs.access(file); } catch { await fs.writeFile(file, '[]\n', 'utf8'); } } }
async function readJson(file) { await ensureDataFiles(); return JSON.parse(await fs.readFile(file, 'utf8')); }
async function writeJson(file, value) { await ensureDataFiles(); await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) { return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, hash) => error ? reject(error) : resolve(`${salt}:${hash.toString('hex')}`))); }
async function passwordsMatch(password, stored) { const [salt, expected] = stored.split(':'); const actual = await hashPassword(password, salt); return crypto.timingSafeEqual(Buffer.from(actual.split(':')[1], 'hex'), Buffer.from(expected, 'hex')); }
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, goal: user.goal, createdAt: user.createdAt }; }
function createSession(user) { const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, { userId: user.id, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 }); return token; }
function readBody(request) { return new Promise((resolve, reject) => { let body = ''; request.on('data', chunk => { body += chunk; if (body.length > 100000) { reject(new Error('Request body too large.')); request.destroy(); } }); request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON request.')); } }); request.on('error', reject); }); }
function sendJson(response, status, payload) { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(payload)); }
function resendRequest(payload) { return new Promise((resolve, reject) => { const req = https.request({ hostname: 'api.resend.com', path: '/emails', method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(payload)) } }, response => { let body = ''; response.on('data', chunk => body += chunk); response.on('end', () => response.statusCode >= 200 && response.statusCode < 300 ? resolve(JSON.parse(body || '{}')) : reject(new Error(`Resend returned ${response.statusCode}`))); }); req.on('error', reject); req.write(JSON.stringify(payload)); req.end(); }); }
async function sendWelcomeEmail(user) {
  const email = { to: user.email, subject: 'Welcome to Cydex', text: `Welcome to Cydex, ${user.name}. Your objective-driven Security+ learning path is ready. Start with today's encryption mission and keep your streak alive.`, createdAt: new Date().toISOString() };
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) { try { await resendRequest({ from: process.env.RESEND_FROM, to: [email.to], subject: email.subject, text: email.text }); return { delivery: 'sent' }; } catch (error) { email.deliveryError = error.message; } }
  const outbox = await readJson(outboxFile); outbox.push(email); await writeJson(outboxFile, outbox); return { delivery: 'queued' };
}
async function handleApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/health') return sendJson(response, 200, { status: 'ok', mode: process.env.RESEND_API_KEY ? 'email-enabled' : 'local-email-outbox' });
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });
  const input = await readBody(request);
  if (pathname === '/api/auth/signup') {
    const name = String(input.name || '').trim(); const email = String(input.email || '').trim().toLowerCase(); const password = String(input.password || '');
    if (name.length < 2 || name.length > 40) return sendJson(response, 400, { error: 'Enter a display name between 2 and 40 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(response, 400, { error: 'Enter a valid email address.' });
    if (password.length < 8) return sendJson(response, 400, { error: 'Use a password with at least 8 characters.' });
    const users = await readJson(usersFile); if (users.some(user => user.email === email)) return sendJson(response, 409, { error: 'An account already exists for this email. Try logging in.' });
    const user = { id: crypto.randomUUID(), name, email, passwordHash: await hashPassword(password), goal: 'CompTIA Security+', createdAt: new Date().toISOString() }; users.push(user); await writeJson(usersFile, users);
    const emailStatus = await sendWelcomeEmail(user); return sendJson(response, 201, { user: publicUser(user), sessionToken: createSession(user), emailStatus });
  }
  if (pathname === '/api/auth/login') {
    const email = String(input.email || '').trim().toLowerCase(); const password = String(input.password || ''); const users = await readJson(usersFile); const user = users.find(item => item.email === email);
    if (!user || !(await passwordsMatch(password, user.passwordHash))) return sendJson(response, 401, { error: 'Email or password is incorrect.' });
    return sendJson(response, 200, { user: publicUser(user), sessionToken: createSession(user), emailStatus: { delivery: 'existing' } });
  }
  return sendJson(response, 404, { error: 'API route not found.' });
}
async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname); const filePath = path.resolve(root, `.${requestedPath}`);
  if (!filePath.startsWith(root)) { response.writeHead(403).end('Forbidden'); return; }
  try { const content = await fs.readFile(filePath); response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' }); response.end(content); } catch (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 500).end(error.code === 'ENOENT' ? 'Not found' : 'Server error'); }
}
const server = http.createServer(async (request, response) => { try { const pathname = new URL(request.url, `http://${request.headers.host}`).pathname; if (pathname.startsWith('/api/')) await handleApi(request, response, pathname); else await serveStatic(request, response, pathname); } catch (error) { sendJson(response, 500, { error: 'The server could not complete that request.' }); console.error(error); } });
async function start() { await loadLocalEnv(); const port = Number(process.env.PORT || 3000); server.listen(port, () => console.log(`Cydex is running at http://localhost:${port}`)); }
start();
