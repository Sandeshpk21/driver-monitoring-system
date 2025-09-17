import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/auth';
import { db } from '../utils/database';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    const decoded = AuthUtils.verifyToken(token);

    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type',
      });
      return;
    }

    // Verify user still exists and is active
    const user = await db.findById('users', decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Account is inactive',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    let message = 'Authentication failed';
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        message = 'Token has expired';
      } else if (error.message.includes('invalid')) {
        message = 'Invalid token';
      }
    }

    res.status(401).json({
      success: false,
      message,
    });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!AuthUtils.hasPermission(req.user.role, roles)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      // No token provided, continue without user context
      next();
      return;
    }

    const decoded = AuthUtils.verifyToken(token);

    if (decoded.type !== 'access') {
      next();
      return;
    }

    const user = await db.findById('users', decoded.userId);

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    // Log the error but don't fail the request
    logger.debug('Optional auth failed:', error);
    next();
  }
};

export const requireSelfOrAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  const targetUserId = req.params.id || req.params.userId;

  if (!AuthUtils.canAccessUserData(req.user.id, req.user.role, targetUserId)) {
    res.status(403).json({
      success: false,
      message: 'Access denied',
    });
    return;
  }

  next();
};