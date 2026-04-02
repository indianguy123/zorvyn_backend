import { schedulePurgeDeletedRecords } from './purgeDeletedRecords';

/**
 * Initialize all cron jobs.
 * Called once from server.ts at application startup.
 */
export const initCronJobs = (): void => {
  console.log('[CRON] Initializing scheduled jobs...');
  schedulePurgeDeletedRecords();
  console.log('[CRON] All jobs scheduled.');
};
