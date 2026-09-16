import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDb, getEngine } from './database/db.js';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import messRoutes from './routes/messRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import salaryRoutes from "./routes/salaryRoutes.js";

import gatePassRoutes from './routes/gatePassRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';



import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../../frontend/dist');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/api/health')) {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Apex Smart Hostel Management System API',
    version: '1.0.0',
    dbEngine: getEngine(),
    geminiConfigured: Boolean(config.gemini.apiKey),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/gate-passes', gatePassRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/salary', salaryRoutes);



// Serve frontend production build statically
app.use(express.static(distPath));

// For all non-API requests, send index.html (Single Page App routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server after DB init
async function bootstrap() {
  try {
    console.log(' Starting Apex Smart Hostel Management Backend...');
    await initDb();

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Smart Hostel Backend Server listening on http://0.0.0.0:${config.port}`);
      console.log(`📡 Local Health Check: http://localhost:${config.port}/api/health`);
      console.log(`📱 Mobile / LAN Access URL: http://192.168.33.192:${config.port}`);
      console.log(` Database Engine Active: [${getEngine().toUpperCase()}]`);
      console.log(` AI Gemini API: [${config.gemini.apiKey ? 'CONNECTED' : 'STANDBY (Smart Rule-Engine Active)'}]`);
    });
  } catch (err) {
    console.error(' Fatal Error starting server:', err);
    process.exit(1);
  }
}

bootstrap();
