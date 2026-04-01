import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors: Record<string, string[]> | null;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message = 'Something went wrong',
  errors: Record<string, string[]> | null = null,
  statusCode = 500
): void => {
  const response: ErrorResponse = {
    success: false,
    message,
    errors,
  };
  res.status(statusCode).json(response);
};
