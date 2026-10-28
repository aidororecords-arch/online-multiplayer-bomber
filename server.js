const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const players = Object.create(null);

app.use(express.static(__dirname, { extensions: ["html"] }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    game: "Bomber Tanks",
    onlinePlayers: Object.keys(players).length
  });
});

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function cleanDesign(value) {
  if (!value || typeof value !== "object") return null;
  const allowed = ["name", "hullColor", "strokeColor", "turretColor", "hatchColor", "speed", "maxHits"];
  const result = {};
  for (const key of allowed) {
    const v = value[key];
    if (typeof v === "string") result[key] = v.slice(0, 40);
    else if (typeof v === "number" && Number.isFinite(v)) result[key] = v;
  }
  return result;
}

function publicPlayer(p) {
  return {
    id: p.id,
    playerId: p.playerId,
    name: p.name,
    design: p.design,
    x: p.x,
    y: p.y,
    angle: p.angle,
    lives: p.lives
  };
}

function broadcastCount() {
  io.emit("online-count", Object.keys(players).length);
}

io.on("connection", (socket) => {
  socket.emit("current-players", Object.fromEntries(
    Object.entries(players).map(([id, p]) => [id, publicPlayer(p)])
  ));
  broadcastCount();

  socket.on("player-join", (data = {}) => {
    const wasAlreadyJoined = Boolean(players[socket.id]);
    const p = {
      id: socket.id,
      playerId: String(data.playerId || "TANK-0000").slice(0, 40),
      name: String(data.name || "Player").slice(0, 40),
      design: cleanDesign(data.design),
      x: Math.max(-100000, Math.min(100000, finiteNumber(data.x, 0))),
      y: Math.max(-100000, Math.min(100000, finiteNumber(data.y, 0))),
      angle: finiteNumber(data.angle, 0),
      lives: Math.max(0, Math.min(1000, finiteNumber(data.lives, 100)))
    };

    players[socket.id] = p;

    // Refresh the joining player's list and announce them to everyone else.
    socket.emit("current-players", Object.fromEntries(
      Object.entries(players).map(([id, item]) => [id, publicPlayer(item)])
    ));
    if (!wasAlreadyJoined) socket.broadcast.emit("new-player", publicPlayer(p));
    else socket.broadcast.emit("player-moved", publicPlayer(p));

    broadcastCount();
    console.log("Player joined:", p.name, socket.id);
  });

  socket.on("player-update", (data = {}) => {
    const p = players[socket.id];
    if (!p) return;

    if (Number.isFinite(data.x)) p.x = Math.max(-100000, Math.min(100000, data.x));
    if (Number.isFinite(data.y)) p.y = Math.max(-100000, Math.min(100000, data.y));
    if (Number.isFinite(data.angle)) p.angle = data.angle;
    if (Number.isFinite(data.lives)) p.lives = Math.max(0, Math.min(1000, data.lives));

    socket.broadcast.emit("player-moved", publicPlayer(p));
  });

  socket.on("drop-bomb", (data = {}) => {
    if (!players[socket.id]) return;
    if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;

    const bomb = {
      id: `${socket.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      x: Math.max(-100000, Math.min(100000, data.x)),
      y: Math.max(-100000, Math.min(100000, data.y)),
      radius: Number.isFinite(data.radius) ? Math.max(1, Math.min(500, data.radius)) : 45,
      ownerId: socket.id
    };
    socket.broadcast.emit("bomb-dropped", bomb);
  });

  socket.on("player-leave", () => {
    if (!players[socket.id]) return;
    delete players[socket.id];
    socket.broadcast.emit("player-disconnected", socket.id);
    broadcastCount();
  });

  socket.on("disconnect", () => {
    if (players[socket.id]) {
      delete players[socket.id];
      io.emit("player-disconnected", socket.id);
      broadcastCount();
      console.log("Player disconnected:", socket.id);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Bomber Tanks server listening on port ${PORT}`);
});
