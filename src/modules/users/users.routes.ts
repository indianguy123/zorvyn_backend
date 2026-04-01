import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { UserRole } from '../../shared/constants';
import { listUsersQuerySchema, userIdParamSchema, updateUserSchema } from './users.schema';
import * as usersController from './users.controller';

const router = Router();

// All user management routes require authentication + admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/', validate(listUsersQuerySchema, 'query'), usersController.listUsers);
router.get('/:id', validate(userIdParamSchema, 'params'), usersController.getUserById);
router.patch('/:id', validate(userIdParamSchema, 'params'), validate(updateUserSchema), usersController.updateUser);
router.patch('/:id/deactivate', validate(userIdParamSchema, 'params'), usersController.deactivateUser);

export default router;
