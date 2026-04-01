import prisma from '../../config/db';
import cloudinary from '../../config/cloudinary';
import { AppError } from '../../shared/appError';
import { CreateRecordInput, UpdateRecordInput, ListRecordsQuery } from './records.schema';
import { RecordResponse, PaginatedResponse } from './records.types';
import { Prisma, FinancialType } from '@prisma/client';

const recordSelect = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  notes: true,
  documentUrl: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, name: true, email: true },
  },
} as const;

/** Upload a file buffer to Cloudinary */
export const uploadDocument = async (fileBuffer: Buffer, originalName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'finance-dashboard/documents',
        resource_type: 'auto',
        public_id: `${Date.now()}-${originalName.replace(/\.[^/.]+$/, '')}`,
      },
      (error, result) => {
        if (error) {
          reject(AppError.internal('Failed to upload document'));
          return;
        }
        resolve(result!.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/** Delete a document from Cloudinary by URL */
const deleteDocumentFromCloudinary = async (url: string): Promise<void> => {
  try {
    // Extract public_id from the URL
    const parts = url.split('/');
    const folderIndex = parts.indexOf('finance-dashboard');
    if (folderIndex === -1) return;

    const publicIdWithExt = parts.slice(folderIndex).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch {
    // Non-critical — log but don't fail the operation
    console.warn('Failed to delete document from Cloudinary:', url);
  }
};

/** Create a new financial record */
export const createRecord = async (
  input: CreateRecordInput,
  createdBy: string,
  documentUrl?: string
): Promise<RecordResponse> => {
  const record = await prisma.financialRecord.create({
    data: {
      amount: input.amount,
      type: input.type as FinancialType,
      category: input.category,
      date: new Date(input.date),
      notes: input.notes || null,
      documentUrl: documentUrl || null,
      createdBy,
    },
    select: recordSelect,
  });

  return record;
};

/** List records with filtering and pagination */
export const listRecords = async (
  query: ListRecordsQuery
): Promise<PaginatedResponse<RecordResponse>> => {
  const { page, limit, type, category, dateFrom, dateTo } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.FinancialRecordWhereInput = {
    isDeleted: false,
  };

  if (type) where.type = type as FinancialType;
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  const [items, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      select: recordSelect,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.financialRecord.count({ where }),
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

/** Get a single record by ID */
export const getRecordById = async (id: string): Promise<RecordResponse> => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    select: recordSelect,
  });

  if (!record) {
    throw AppError.notFound('Financial record');
  }

  return record;
};

/** Update a financial record */
export const updateRecord = async (
  id: string,
  input: UpdateRecordInput,
  documentUrl?: string
): Promise<RecordResponse> => {
  const existing = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw AppError.notFound('Financial record');
  }

  const updateData: Prisma.FinancialRecordUpdateInput = {};
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.type !== undefined) updateData.type = input.type as FinancialType;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.date !== undefined) updateData.date = new Date(input.date);
  if (input.notes !== undefined) updateData.notes = input.notes;

  if (documentUrl !== undefined) {
    // Delete the old document from Cloudinary if it exists
    if (existing.documentUrl) {
      await deleteDocumentFromCloudinary(existing.documentUrl);
    }
    updateData.documentUrl = documentUrl;
  }

  const record = await prisma.financialRecord.update({
    where: { id },
    data: updateData,
    select: recordSelect,
  });

  return record;
};

/** Soft delete a financial record */
export const softDeleteRecord = async (id: string): Promise<RecordResponse> => {
  const existing = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw AppError.notFound('Financial record');
  }

  const record = await prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true },
    select: recordSelect,
  });

  return record;
};

/** Export all (non-deleted) records as CSV string — analyst + admin only */
export const exportRecordsCsv = async (query: ListRecordsQuery): Promise<string> => {
  const where: Prisma.FinancialRecordWhereInput = { isDeleted: false };

  if (query.type) where.type = query.type as FinancialType;
  if (query.category) where.category = { contains: query.category, mode: 'insensitive' };
  if (query.dateFrom || query.dateTo) {
    where.date = {};
    if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
    if (query.dateTo) where.date.lte = new Date(query.dateTo);
  }

  const records = await prisma.financialRecord.findMany({
    where,
    select: recordSelect,
    orderBy: { date: 'desc' },
  });

  // Build CSV
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes', 'Created By', 'Document URL'];
  const rows = records.map((r) => [
    new Date(r.date).toISOString().split('T')[0],
    r.type,
    r.category,
    r.amount.toString(),
    `"${(r.notes || '').replace(/"/g, '""')}"`,
    r.creator?.name || '',
    r.documentUrl || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};
