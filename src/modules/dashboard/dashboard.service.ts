import prisma from '../../config/db';
import { DashboardQuery, TrendsQuery, RecentActivityQuery } from './dashboard.schema';
import {
  SummaryData,
  CategoryBreakdown,
  TrendDataPoint,
  RecentActivity,
} from './dashboard.types';
import { Prisma } from '@prisma/client';

/** Build a base date-range filter for financial records */
const buildDateFilter = (dateFrom?: string, dateTo?: string): Prisma.FinancialRecordWhereInput => {
  const where: Prisma.FinancialRecordWhereInput = { isDeleted: false };

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  return where;
};

/** Get total income, total expenses, net balance */
export const getSummary = async (query: DashboardQuery): Promise<SummaryData> => {
  const where = buildDateFilter(query.dateFrom, query.dateTo);

  const [incomeResult, expenseResult, countResult] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { ...where, type: 'income' },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: { ...where, type: 'expense' },
      _sum: { amount: true },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  const totalIncome = Number(incomeResult._sum.amount || 0);
  const totalExpenses = Number(expenseResult._sum.amount || 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    recordCount: countResult,
  };
};

/** Get category-wise grouped totals */
export const getCategoryBreakdown = async (
  query: DashboardQuery
): Promise<CategoryBreakdown[]> => {
  const where = buildDateFilter(query.dateFrom, query.dateTo);

  const results = await prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    where,
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  return results.map((r) => ({
    category: r.category,
    type: r.type,
    total: Number(r._sum.amount || 0),
    count: r._count.id,
  }));
};

/** Get monthly or weekly income vs expense trends */
export const getTrends = async (query: TrendsQuery): Promise<TrendDataPoint[]> => {
  const where = buildDateFilter(query.dateFrom, query.dateTo);
  const isMonthly = query.period === 'monthly';

  // Use raw SQL for date truncation — Prisma groupBy doesn't support date_trunc
  const dateFormat = isMonthly ? 'YYYY-MM' : 'IYYY-IW';

  const results = await prisma.$queryRaw<
    { period: string; type: string; total: number }[]
  >`
    SELECT
      TO_CHAR(date, ${dateFormat}) as period,
      type::text,
      COALESCE(SUM(amount), 0)::float as total
    FROM financial_records
    WHERE is_deleted = false
      ${query.dateFrom ? Prisma.sql`AND date >= ${new Date(query.dateFrom)}` : Prisma.empty}
      ${query.dateTo ? Prisma.sql`AND date <= ${new Date(query.dateTo)}` : Prisma.empty}
    GROUP BY period, type
    ORDER BY period ASC
  `;

  // Pivot the results into income/expense pairs per period
  const periodMap = new Map<string, TrendDataPoint>();

  for (const row of results) {
    if (!periodMap.has(row.period)) {
      periodMap.set(row.period, {
        period: row.period,
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    const point = periodMap.get(row.period)!;
    if (row.type === 'income') {
      point.income = row.total;
    } else {
      point.expense = row.total;
    }
    point.net = point.income - point.expense;
  }

  return Array.from(periodMap.values());
};

/** Get recent financial activity */
export const getRecentActivity = async (
  query: RecentActivityQuery
): Promise<RecentActivity[]> => {
  const records = await prisma.financialRecord.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      notes: true,
      createdAt: true,
      creator: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: query.limit,
  });

  return records.map((r) => ({
    ...r,
    amount: Number(r.amount),
  }));
};
