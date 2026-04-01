import { z } from 'zod';

export const createRecordSchema = z.object({
  amount: z.coerce
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be a positive number'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: "Type must be 'income' or 'expense'" }),
  }),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category is required')
    .max(50, 'Category must not exceed 50 characters'),
  date: z
    .string({ required_error: 'Date is required' })
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date'),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
});

export const updateRecordSchema = z.object({
  amount: z.coerce.number().positive('Amount must be a positive number').optional(),
  type: z
    .enum(['income', 'expense'], {
      errorMap: () => ({ message: "Type must be 'income' or 'expense'" }),
    })
    .optional(),
  category: z.string().min(1).max(50, 'Category must not exceed 50 characters').optional(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date')
    .optional(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'At least one field must be provided for update' }
);

export const recordIdParamSchema = z.object({
  id: z.string().uuid('Invalid record ID format'),
});

export const listRecordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  dateFrom: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date')
    .optional(),
  dateTo: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date')
    .optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;
