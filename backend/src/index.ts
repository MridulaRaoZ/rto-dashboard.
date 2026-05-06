import express from 'express';
import { config } from './config.js';
import { getDb } from './db.js';
import { buildBotRouter } from './bot/botApp.js';
import { startScheduler } from './bot/scheduler.js';
import attendanceRouter from './routes/attendance.js';
import teamRouter from './routes/team.js';
import botWebhookRouter from './routes/bot-webhook.js';

const app = express();
app.use(express.json());

// CORS — allow the Vite frontend in development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-scheduler-secret');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// Routes
app.use('/api', attendanceRouter);
app.use('/api', teamRouter);
app.use('/api', botWebhookRouter);
app.use('/api', buildBotRouter()); // /api/messages — Bot Framework endpoint

app.get('/health', (_req, res) => res.json({ ok: true }));

// Initialize DB and start
getDb();
startScheduler();

app.listen(config.port, () => {
  console.log(`RTO backend listening on http://localhost:${config.port}`);
});
