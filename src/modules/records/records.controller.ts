import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import { sendSuccess } from '../../shared/responseHelper';
import * as recordsService from './records.service';

/** POST /api/records — Create a financial record (with optional document upload) */
export const createRecord = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let documentUrl: string | undefined;

  if (req.file) {
    documentUrl = await recordsService.uploadDocument(req.file.buffer, req.file.originalname);
  }

  const record = await recordsService.createRecord(req.body, req.user!.id, documentUrl);
  sendSuccess(res, record, 'Financial record created successfully', 201);
});

/** GET /api/records — List records with filters and pagination */
export const listRecords = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await recordsService.listRecords(req.query as any);
  sendSuccess(res, result, 'Financial records retrieved successfully');
});

/** GET /api/records/:id — Get a single record */
export const getRecordById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const record = await recordsService.getRecordById(req.params.id as string);
  sendSuccess(res, record, 'Financial record retrieved successfully');
});

/** PATCH /api/records/:id — Update a financial record */
export const updateRecord = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let documentUrl: string | undefined;

  if (req.file) {
    documentUrl = await recordsService.uploadDocument(req.file.buffer, req.file.originalname);
  }

  const record = await recordsService.updateRecord(req.params.id as string, req.body, documentUrl);
  sendSuccess(res, record, 'Financial record updated successfully');
});

/** DELETE /api/records/:id — Soft delete a financial record */
export const deleteRecord = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const record = await recordsService.softDeleteRecord(req.params.id as string);
  sendSuccess(res, record, 'Financial record deleted successfully');
});

/** GET /api/records/export — Export records as CSV (analyst + admin only) */
export const exportRecords = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const csv = await recordsService.exportRecordsCsv(req.query as any);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=financial_records.csv');
  res.send(csv);
});
