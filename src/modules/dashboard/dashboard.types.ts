export interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  recordCount: number;
}

export interface CategoryBreakdown {
  category: string;
  type: string;
  total: number;
  count: number;
}

export interface TrendDataPoint {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface RecentActivity {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
  creator: {
    name: string;
    email: string;
  };
}
