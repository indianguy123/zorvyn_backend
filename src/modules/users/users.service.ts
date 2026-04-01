import prisma from '../../config/db';
import { AppError } from '../../shared/appError';
import { ListUsersQuery } from './users.schema';
import { UserResponse, PaginatedResponse } from './users.types';
import { Prisma, Role, Status } from '@prisma/client';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** List users with pagination and optional filters */
export const listUsers = async (query: ListUsersQuery): Promise<PaginatedResponse<UserResponse>> => {
  const { page, limit, role, status, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (role) where.role = role as Role;
  if (status) where.status = status as Status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/** Get a single user by ID */
export const getUserById = async (id: string): Promise<UserResponse> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw AppError.notFound('User');
  }

  return user;
};

/** Update a user's role and/or status */
export const updateUser = async (
  id: string,
  data: { role?: string; status?: string }
): Promise<UserResponse> => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw AppError.notFound('User');
  }

  const updateData: Prisma.UserUpdateInput = {};
  if (data.role) updateData.role = data.role as Role;
  if (data.status) updateData.status = data.status as Status;

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: userSelect,
  });

  return updated;
};

/** Deactivate a user (set status to inactive) */
export const deactivateUser = async (id: string): Promise<UserResponse> => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw AppError.notFound('User');
  }

  if (user.status === 'inactive') {
    throw AppError.badRequest('User is already deactivated');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'inactive' },
    select: userSelect,
  });

  return updated;
};
