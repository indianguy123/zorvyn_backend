import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import { globalLimiter } from './middleware/rateLimiter'; // Disabled for dev
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './shared/appError';

// Module routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import recordsRoutes from './modules/records/records.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

// --- Global middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter on all API routes (disabled for dev)
// app.use('/api', globalLimiter);

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Finance Dashboard API is running', timestamp: new Date().toISOString() });
});

// --- Mount module routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- 404 handler for unknown routes ---
app.all('*', (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
});

// --- Global error handler (must be last) ---
app.use(errorHandler);

export default app;
