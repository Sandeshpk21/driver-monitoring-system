import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log error details
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference';
  } else if (err.message.includes('violates not-null constraint')) {
    statusCode = 400;
    message = 'Missing required field';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

// Helper functions for common HTTP errors
export const badRequest = (message: string = 'Bad Request') => {
  throw new CustomError(message, 400);
};

export const unauthorized = (message: string = 'Unauthorized') => {
  throw new CustomError(message, 401);
};

export const forbidden = (message: string = 'Forbidden') => {
  throw new CustomError(message, 403);
};

export const notFoundError = (message: string = 'Not Found') => {
  throw new CustomError(message, 404);
};

export const conflict = (message: string = 'Conflict') => {
  throw new CustomError(message, 409);
};

export const unprocessableEntity = (message: string = 'Unprocessable Entity') => {
  throw new CustomError(message, 422);
};

export const internalServerError = (message: string = 'Internal Server Error') => {
  throw new CustomError(message, 500);
};