const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const AVATARS_DIR = path.join(__dirname, 'data', 'avatars');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve avatars statically
fs.mkdirSync(AVATARS_DIR, { recursive: true });
app.use('/avatars', express.static(AVATARS_DIR));

// ─── Database ───
const db = new Database(path.join(__dirname, 'data', 'lives.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    password TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    youtube_id TEXT NOT NULL,
    ad_time INTEGER DEFAULT 90,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Add avatar_url column if missing (migration for existing DBs)
try { db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ""'); } catch {}

// ─── Seed admin if none exists ───
const adminCount = db.prepare('SELECT COUNT(*) as c FROM admins').get().c;
if (adminCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (email, password) VALUES (?, ?)').run('admin@carolinemoschei.com', hash);
  console.log('Admin criado: admin@carolinemoschei.com / admin123');
}

// ─── Seed lives if none exist ───
const livesCount = db.prepare('SELECT COUNT(*) as c FROM lives').get().c;
if (livesCount === 0) {
  const insert = db.prepare('INSERT INTO lives (title, description, youtube_id, ad_time, sort_order) VALUES (?, ?, ?, ?, ?)');
  insert.run('Direcao Fotografica na Pratica', 'EP 20 — ART.SESSIONS', 'janft5jSBeE', 120, 1);
  insert.run('Tratamento de Pele no Photoshop com I.A', 'EP 19 — ART.SESSIONS — Vale a pena investir?', 'I9VBNKfg7vM', 90, 2);
  insert.run('Como criar ensaios de gestante atrativos', 'ART.SESSIONS #15', 'aqmgC1F4-ME', 60, 3);
  console.log('3 lives iniciais criadas');
}

function generateToken() { return crypto.randomBytes(32).toString('hex'); }

// Auth middleware
function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  const session = db.prepare('SELECT s.user_id, u.name, u.email, u.phone, u.avatar_url FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?').get(token);
  if (!session) return res.status(401).json({ error: 'Sessao invalida' });
  req.user = session;
  next();
}

// ─── AUTH: User ───

// Register
app.post('/api/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha sao obrigatorios' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email ja cadastrado' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)').run(name, email, phone || '', hash);

  const token = generateToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, result.lastInsertRowid);

  res.json({ token, user: { id: result.lastInsertRowid, name, email, phone: phone || '', avatar_url: '' } });
});

// Login (checks users table first, then admins)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatorios' });

  // Check admin first
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (admin && bcrypt.compareSync(password, admin.password)) {
    const token = 'admin_' + generateToken();
    return res.json({ token, is_admin: true, user: { id: admin.id, name: 'Admin', email: admin.email, phone: '', avatar_url: '' } });
  }

  // Then check regular users
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }

  const token = generateToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);

  res.json({ token, is_admin: false, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar_url: user.avatar_url || '' } });
});

// Get profile
app.get('/api/me', requireUser, (req, res) => {
  res.json({ user: { id: req.user.user_id, name: req.user.name, email: req.user.email, phone: req.user.phone || '', avatar_url: req.user.avatar_url || '' } });
});

// Update profile
app.put('/api/me', requireUser, (req, res) => {
  const { name, email, phone, password } = req.body;
  const uid = req.user.user_id;

  if (email && email !== req.user.email) {
    const dup = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, uid);
    if (dup) return res.status(409).json({ error: 'Email ja em uso por outra conta' });
  }

  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, uid);
  if (email) db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, uid);
  if (phone !== undefined) db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone, uid);
  if (password && password.length >= 4) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, uid);
  }

  const updated = db.prepare('SELECT id, name, email, phone, avatar_url FROM users WHERE id = ?').get(uid);
  res.json({ user: updated });
});

// Upload avatar
app.post('/api/me/avatar', requireUser, (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Imagem obrigatoria' });

  const match = image.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Formato de imagem invalido' });

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const filename = `avatar_${req.user.user_id}_${Date.now()}.${ext}`;

  fs.writeFileSync(path.join(AVATARS_DIR, filename), buffer);

  const avatarUrl = `/avatars/${filename}`;
  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.user_id);

  res.json({ avatar_url: avatarUrl });
});

// Logout
app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ ok: true });
});

// ─── AUTH: Admin ───
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatorios' });

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  const token = 'admin_' + generateToken();
  res.json({ token, admin: { id: admin.id, email: admin.email } });
});

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !token.startsWith('admin_')) return res.status(403).json({ error: 'Acesso negado' });
  next();
}

// ─── LIVES API ───
app.get('/api/lives', (req, res) => {
  const lives = db.prepare('SELECT id, title, description, youtube_id, ad_time, sort_order FROM lives WHERE is_active = 1 ORDER BY sort_order ASC').all();
  res.json(lives);
});

app.get('/api/admin/lives', requireAdmin, (req, res) => {
  const lives = db.prepare('SELECT * FROM lives ORDER BY sort_order ASC').all();
  res.json(lives);
});

app.post('/api/admin/lives', requireAdmin, (req, res) => {
  const { title, description, youtube_id, ad_time } = req.body;
  if (!title || !youtube_id) return res.status(400).json({ error: 'Titulo e YouTube ID obrigatorios' });
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM lives').get().m || 0;
  const result = db.prepare('INSERT INTO lives (title, description, youtube_id, ad_time, sort_order) VALUES (?, ?, ?, ?, ?)').run(title, description || '', youtube_id, ad_time || 90, maxOrder + 1);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/admin/lives/:id', requireAdmin, (req, res) => {
  const { title, description, youtube_id, ad_time, is_active } = req.body;
  db.prepare('UPDATE lives SET title = COALESCE(?, title), description = COALESCE(?, description), youtube_id = COALESCE(?, youtube_id), ad_time = COALESCE(?, ad_time), is_active = COALESCE(?, is_active) WHERE id = ?')
    .run(title, description, youtube_id, ad_time, is_active, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/lives/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM lives WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, phone, avatar_url, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// ─── Start ───
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
