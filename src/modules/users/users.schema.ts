import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  role: z.enum(['viewer', 'analyst', 'admin']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export const updateUserSchema = z.object({
  role: z
    .enum(['viewer', 'analyst', 'admin'], {
      errorMap: () => ({ message: "Role must be 'viewer', 'analyst', or 'admin'" }),
    })
    .optional(),
  status: z
    .enum(['active', 'inactive'], {
      errorMap: () => ({ message: "Status must be 'active' or 'inactive'" }),
    })
    .optional(),
}).refine((data) => data.role !== undefined || data.status !== undefined, {
  message: 'At least one field (role or status) must be provided',
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
