import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { UserRole } from '../../shared/constants';
import {
  createRecordSchema,
  updateRecordSchema,
  recordIdParamSchema,
  listRecordsQuerySchema,
} from './records.schema';
import * as recordsController from './records.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read routes — all roles can access
router.get(
  '/',
  authorize(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN),
  validate(listRecordsQuerySchema, 'query'),
  recordsController.listRecords
);

// Export routes — analyst + admin only (must come before /:id)
router.get(
  '/export',
  authorize(UserRole.ANALYST, UserRole.ADMIN),
  validate(listRecordsQuerySchema, 'query'),
  recordsController.exportRecords
);

router.get(
  '/:id',
  authorize(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN),
  validate(recordIdParamSchema, 'params'),
  recordsController.getRecordById
);

// Write routes — admin only
router.post(
  '/',
  authorize(UserRole.ADMIN),
  upload.single('document'),
  validate(createRecordSchema),
  recordsController.createRecord
);

router.patch(
  '/:id',
  authorize(UserRole.ADMIN),
  upload.single('document'),
  validate(recordIdParamSchema, 'params'),
  validate(updateRecordSchema),
  recordsController.updateRecord
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(recordIdParamSchema, 'params'),
  recordsController.deleteRecord
);

export default router;
