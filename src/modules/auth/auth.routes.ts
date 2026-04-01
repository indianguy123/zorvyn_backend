import { Router } from 'express';
import { validate } from '../../middleware/validate';
// import { authLimiter } from '../../middleware/rateLimiter'; // Disabled for dev
import { registerSchema, loginSchema } from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

// Stricter rate limiting on auth routes (disabled for dev)
// router.use(authLimiter);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

export default router;
