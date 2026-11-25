import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';

const root = fileURLToPath(new URL('.', import.meta.url));
const dist = resolve(root, 'dist');
const port = Number(process.env.PORT ?? 3001);
const maxPlayers = 32;
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream' };

const httpServer = createServer((request, response) => {
  if (request.url === '/health') { response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify({ ok: true, players: io.engine.clientsCount })); return; }
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname); } catch { response.writeHead(400); response.end(); return; }
  const requested = resolve(dist, `.${pathname}`);
  const safeRoot = `${dist}${sep}`;
  if (pathname.startsWith('/models/') && (!requested.startsWith(safeRoot) || !existsSync(requested))) { response.writeHead(404, { 'content-type': 'application/octet-stream' }); response.end(); return; }
  const file = requested.startsWith(safeRoot) && existsSync(requested) && statSync(requested).isFile() ? requested : resolve(dist, 'index.html');
  if (!existsSync(file)) { response.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' }); response.end('Build not found. Run npm run build first.'); return; }
  response.writeHead(200, { 'content-type': mimeTypes[extname(file).toLowerCase()] ?? 'application/octet-stream', 'x-content-type-options': 'nosniff', 'cache-control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' });
  if (request.method === 'HEAD') { response.end(); return; }
  createReadStream(file).pipe(response);
});

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins.length ? allowedOrigins : ['http://localhost:5173', 'http://127.0.0.1:5173', `http://localhost:${port}`], methods: ['GET', 'POST'] },
  pingInterval: 25000,
  pingTimeout: 20000,
  maxHttpBufferSize: 64 * 1024,
});

const rooms = new Map();
const roomId = 'aurora';
let sharedQuests = null;
let sharedMission = { missionPhase: 'available', enemiesRemaining: 0 };
function validQuests(payload) {
  if (!payload || !Array.isArray(payload.quests) || payload.quests.length > 3) return null;
  const ids = new Set(['contracts', 'witness', 'patrol']);
  const quests = payload.quests.filter((quest) => quest && ids.has(quest.id) && ['available', 'active', 'complete'].includes(quest.status) && Number.isInteger(quest.progress) && quest.progress >= 0 && quest.progress <= 3).map(({ id, status, progress }) => ({ id, status, progress }));
  if (quests.length !== 3) return null;
  return { quests, trackedQuestId: ids.has(payload.trackedQuestId) ? payload.trackedQuestId : null };
}
function safeName(value) { return String(value ?? 'Investigador').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 24) || 'Investigador'; }
function safeRole(value) { return ['police', 'civilian', 'criminal'].includes(value) ? value : 'civilian'; }
function safePose(value) {
  if (!value || ![value.x, value.z, value.yaw].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  return { x: Math.max(-120, Math.min(120, value.x)), z: Math.max(-120, Math.min(120, value.z)), yaw: Math.atan2(Math.sin(value.yaw), Math.cos(value.yaw)), walking: Boolean(value.walking), sprinting: Boolean(value.sprinting), driving: Boolean(value.driving), updatedAt: Date.now() };
}

io.on('connection', (socket) => {
  if (io.of('/').sockets.size > maxPlayers) { socket.emit('server:full'); socket.disconnect(true); return; }
  socket.data.lastMove = 0;
  socket.data.room = roomId;
  socket.join(roomId);
  const player = { id: socket.id, name: 'Investigador', role: 'civilian', x: 5, z: 5, yaw: 0, walking: false, sprinting: false, driving: false };
  rooms.set(socket.id, player);

  socket.on('room:join', (payload = {}) => {
    player.name = safeName(payload.name);
    player.role = safeRole(payload.role);
    socket.emit('room:players', Array.from(rooms.values()).filter((entry) => entry.id !== socket.id));
    if (sharedQuests) socket.emit('room:quests', sharedQuests);
    socket.emit('room:mission', sharedMission);
    socket.to(roomId).emit('player:join', player);
  });

  socket.on('quests:update', (payload) => {
    const quests = validQuests(payload);
    if (!quests) return;
    sharedQuests = quests;
    socket.to(roomId).emit('quests:sync', quests);
  });

  socket.on('mission:update', (payload = {}) => {
    const phases = ['available', 'evidence', 'shootout', 'complete'];
    if (!phases.includes(payload.missionPhase) || !Number.isInteger(payload.enemiesRemaining) || payload.enemiesRemaining < 0 || payload.enemiesRemaining > 4) return;
    sharedMission = { missionPhase: payload.missionPhase, enemiesRemaining: payload.enemiesRemaining };
    socket.to(roomId).emit('mission:sync', sharedMission);
  });

  socket.on('player:move', (payload) => {
    const now = Date.now();
    if (now - socket.data.lastMove < 30) return;
    const pose = safePose(payload);
    if (!pose) return;
    socket.data.lastMove = now;
    Object.assign(player, pose);
    socket.to(roomId).volatile.emit('player:move', player);
  });

  socket.on('voice:join', () => {
    socket.emit('voice:peers', Array.from(rooms.values()).filter((entry) => entry.id !== socket.id).map((entry) => ({ id: entry.id, name: entry.name })));
    socket.to(roomId).emit('voice:peer-joined', { id: socket.id, name: player.name });
  });
  socket.on('voice:leave', () => socket.to(roomId).emit('voice:peer-left', { id: socket.id }));
  socket.on('voice:signal', (payload = {}) => {
    if (typeof payload.to !== 'string' || !io.sockets.sockets.has(payload.to)) return;
    const signal = payload.signal;
    if (!signal || !['offer', 'answer', 'ice'].includes(signal.type)) return;
    io.to(payload.to).emit('voice:signal', { from: socket.id, signal });
  });
  socket.on('voice:talking', (payload = {}) => socket.to(roomId).emit('voice:talking', { id: socket.id, speaking: Boolean(payload.speaking) }));
  socket.on('disconnect', () => {
    rooms.delete(socket.id);
    socket.to(roomId).emit('player:leave', { id: socket.id });
    socket.to(roomId).emit('voice:peer-left', { id: socket.id });
  });
});

httpServer.listen(port, '0.0.0.0', () => console.log(`FAZ O L multiplayer listening on port ${port}`));
