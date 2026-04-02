import { env } from './config/env';
import { connectDatabase } from './config/db';
import app from './app';
import { initCronJobs } from './cron';

const startServer = async (): Promise<void> => {
  // 1. Connect to database (fail fast if connection fails)
  await connectDatabase();

  // 2. Start the HTTP server
  app.listen(env.PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════╗
    ║   Finance Dashboard API                       ║
    ║   Environment: ${env.NODE_ENV.padEnd(30)}  ║
    ║   Port: ${String(env.PORT).padEnd(37)}  ║
    ║   URL: http://localhost:${String(env.PORT).padEnd(22)}║
    ╚═══════════════════════════════════════════════╝
    `);

    // 3. Start scheduled cron jobs
    initCronJobs();
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
