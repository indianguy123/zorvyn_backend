import multer from 'multer';
import { AppError } from '../shared/appError';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

/**
 * Multer upload middleware configured for document uploads.
 * - Max file size: 10MB
 * - Allowed types: PDF, JPEG, PNG, WebP, Excel, CSV
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(AppError.badRequest(`File type '${file.mimetype}' is not allowed. Allowed: PDF, JPEG, PNG, WebP, Excel, CSV`));
    }
  },
});
