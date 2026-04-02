import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../shared/appError';
import { RegisterInput, LoginInput } from './auth.schema';
import { AuthResponse, AuthTokenPayload } from './auth.types';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;

/** Hash a plaintext password */
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/** Compare plaintext password against a hash */
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/** Generate a signed JWT */
const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

/** Register a new user */
export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw AppError.conflict('A user with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role as Role,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { token, user };
};

/** Authenticate user and return a JWT */
export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (user.status === 'inactive') {
    throw AppError.forbidden('Account has been deactivated. Contact an administrator.');
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};
