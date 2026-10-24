const express = require('express');
const mysql = require('mysql2/promise');
const client = require('prom-client');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const httpRequestCounter = new client.Counter({
  name: 'gym_http_requests_total',
  help: 'Tong so luong request HTTP den he thong Gym',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.labels(req.method, req.path, res.statusCode).inc();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      clientIp: req.ip
    }));
  });
  next();
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'gym_user',
  password: process.env.DB_PASSWORD || 'gym_password_123',
  database: process.env.DB_NAME || 'gym_db',
  waitForConnections: true,
  connectionLimit: 10
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

app.get('/api/health', (req, res) => res.json({ status: 'UP', service: 'Gym Service' }));

app.get('/api/stats', async (req, res) => {
  try {
    const [[{ total_members }]] = await pool.query('SELECT COUNT(*) as total_members FROM members');
    const [[{ total_trainers }]] = await pool.query('SELECT COUNT(*) as total_trainers FROM trainers');
    const [[{ total_packages }]] = await pool.query('SELECT COUNT(*) as total_packages FROM packages');
    const [[{ total_schedules }]] = await pool.query('SELECT COUNT(*) as total_schedules FROM schedules WHERE status = "SCHEDULED"');
    res.json({ total_members, total_trainers, total_packages, total_schedules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM members ORDER BY id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/members', async (req, res) => {
  const { full_name, phone, email } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO members (full_name, phone, email, join_date) VALUES (?, ?, ?, NOW())',
      [full_name, phone, email]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM members WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/packages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM packages ORDER BY price ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/packages', async (req, res) => {
  const { name, duration_months, price } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO packages (name, duration_months, price) VALUES (?, ?, ?)', [name, duration_months, price]);
    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/packages/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM packages WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/trainers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trainers ORDER BY id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/trainers', async (req, res) => {
  const { full_name, specialty, phone } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO trainers (full_name, specialty, phone) VALUES (?, ?, ?)', [full_name, specialty, phone]);
    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/trainers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trainers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/schedules', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.member_id, s.trainer_id, m.full_name AS member_name, 
             t.full_name AS trainer_name, s.workout_time, s.status
      FROM schedules s
      JOIN members m ON s.member_id = m.id
      JOIN trainers t ON s.trainer_id = t.id
      ORDER BY s.workout_time DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/schedules', async (req, res) => {
  const { member_id, trainer_id, workout_time } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO schedules (member_id, trainer_id, workout_time, status) VALUES (?, ?, ?, "SCHEDULED")',
      [member_id, trainer_id, workout_time]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/schedules/:id/status', async (req, res) => {
  try {
    await pool.query('UPDATE schedules SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/schedules/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM schedules WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(JSON.stringify({ event: 'server_started', port: PORT })));
