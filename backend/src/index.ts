// backend/src/index.ts - EnsureCare Healthcare Coordination API Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { twilioRouter } from './routes/twilioRoutes.js';
import { patientRouter } from './routes/patientRoutes.js';
import { labRouter } from './routes/labRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'EnsureCare Healthcare Backend API',
    timestamp: new Date().toISOString(),
    telephony: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'mock-mode'
  });
});

// Mounted Routes
app.use('/api/twilio', twilioRouter);
app.use('/api/records', patientRouter);
app.use('/api/lab', labRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`[EnsureCare Backend] Server running on http://localhost:${PORT}`);
  console.log(`[EnsureCare Backend] Telephony Route: http://localhost:${PORT}/api/twilio/call`);
  console.log(`[EnsureCare Backend] Records Route:   http://localhost:${PORT}/api/records`);
});
