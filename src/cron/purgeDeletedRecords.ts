import cron from 'node-cron';
import prisma from '../config/db';

/**
 * Cron job: Permanently delete soft-deleted financial records.
 *
 * Schedule: Every day at 3:00 AM (server time)
 * Cron expression: '0 3 * * *'
 *
 * This hard-deletes all records that were soft-deleted (isDeleted = true),
 * keeping the database clean while still giving admins a grace period
 * to recover accidentally deleted data during the day.
 */
export const schedulePurgeDeletedRecords = (): void => {
  cron.schedule('0 3 * * *', async () => {
    const jobName = '[CRON] purge-deleted-records';
    console.log(`${jobName} — Starting at ${new Date().toISOString()}`);

    try {
      const result = await prisma.financialRecord.deleteMany({
        where: { isDeleted: true },
      });

      console.log(
        `${jobName} — Permanently deleted ${result.count} soft-deleted record(s)`
      );
    } catch (error) {
      console.error(`${jobName} — Failed:`, error);
    }
  });

  console.log('[CRON] Scheduled: purge-deleted-records (daily at 3:00 AM)');
};
