import { Decimal } from '@prisma/client/runtime/library';

export interface RecordResponse {
  id: string;
  amount: Decimal;
  type: string;
  category: string;
  date: Date;
  notes: string | null;
  documentUrl: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
