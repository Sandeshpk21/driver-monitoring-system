import { Request, Response } from 'express';
import { db } from '../utils/database';
import { AuthUtils } from '../utils/auth';
import { CustomError, asyncHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  ApiResponse,
} from '../types';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginRequest = req.body;

  // Find user by email
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email.toLowerCase()]
  );

  const user = result.rows[0];

  if (!user) {
    throw new CustomError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await AuthUtils.comparePassword(
    password,
    user.password_hash
  );

  if (!isPasswordValid) {
    throw new CustomError('Invalid credentials', 401);
  }

  // Generate tokens
  const userData: User = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };

  const token = AuthUtils.generateAccessToken(userData);
  const refreshToken = AuthUtils.generateRefreshToken(userData);

  logger.info(`User logged in: ${user.email}`);

  const response: ApiResponse<LoginResponse> = {
    success: true,
    data: {
      user: userData,
      token,
      refreshToken,
    },
    message: 'Login successful',
  };

  res.json(response);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, role }: RegisterRequest = req.body;

  // Check if email is valid
  if (!AuthUtils.isValidEmail(email)) {
    throw new CustomError('Invalid email format', 400);
  }

  // Check if password is strong enough
  const passwordValidation = AuthUtils.isValidPassword(password);
  if (!passwordValidation.valid) {
    throw new CustomError(passwordValidation.errors.join(', '), 400);
  }

  // Check if user already exists
  const existingUser = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new CustomError('User already exists', 409);
  }

  // Hash password
  const hashedPassword = await AuthUtils.hashPassword(password);

  // Create user
  const result = await db.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, role, is_active, created_at, updated_at`,
    [email.toLowerCase(), hashedPassword, fullName, role || 'driver']
  );

  const newUser = result.rows[0];

  // If driver role, create driver profile
  if (newUser.role === 'driver') {
    await db.query(
      'INSERT INTO drivers (id) VALUES ($1)',
      [newUser.id]
    );
  }

  const userData: User = {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.full_name,
    role: newUser.role,
    isActive: newUser.is_active,
    createdAt: newUser.created_at,
    updatedAt: newUser.updated_at,
  };

  // Generate tokens
  const token = AuthUtils.generateAccessToken(userData);
  const refreshToken = AuthUtils.generateRefreshToken(userData);

  logger.info(`New user registered: ${newUser.email}`);

  const response: ApiResponse<LoginResponse> = {
    success: true,
    data: {
      user: userData,
      token,
      refreshToken,
    },
    message: 'Registration successful',
  };

  res.status(201).json(response);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new CustomError('Refresh token required', 400);
  }

  try {
    const decoded = AuthUtils.verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new CustomError('Invalid token type', 400);
    }

    // Verify user still exists and is active
    const user = await db.findById('users', decoded.userId);

    if (!user || !user.is_active) {
      throw new CustomError('Invalid refresh token', 401);
    }

    const userData: User = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    // Generate new tokens
    const newToken = AuthUtils.generateAccessToken(userData);
    const newRefreshToken = AuthUtils.generateRefreshToken(userData);

    const response: ApiResponse<{ token: string; refreshToken: string }> = {
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
      message: 'Token refreshed successfully',
    };

    res.json(response);
  } catch (error) {
    throw new CustomError('Invalid refresh token', 401);
  }
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new CustomError('User not authenticated', 401);
  }

  const user = await db.findById('users', req.user.id);

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  let userDetails = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };

  // If driver, get additional driver details
  if (user.role === 'driver') {
    const driver = await db.findById('drivers', user.id);
    if (driver) {
      userDetails = {
        ...userDetails,
        ...{
          licenseNumber: driver.license_number,
          phoneNumber: driver.phone_number,
          vehicleInfo: driver.vehicle_info,
          emergencyContact: driver.emergency_contact,
        },
      };
    }
  }

  const response: ApiResponse<any> = {
    success: true,
    data: userDetails,
  };

  res.json(response);
});

export const changePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user
    const user = await db.findById('users', req.user.id);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await AuthUtils.comparePassword(
      currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      throw new CustomError('Current password is incorrect', 400);
    }

    // Validate new password
    const passwordValidation = AuthUtils.isValidPassword(newPassword);
    if (!passwordValidation.valid) {
      throw new CustomError(passwordValidation.errors.join(', '), 400);
    }

    // Hash new password
    const hashedNewPassword = await AuthUtils.hashPassword(newPassword);

    // Update password
    await db.update('users', req.user.id, {
      password_hash: hashedNewPassword,
    });

    logger.info(`Password changed for user: ${user.email}`);

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
    };

    res.json(response);
  }
);

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just return a success response
  logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

  const response: ApiResponse = {
    success: true,
    message: 'Logout successful',
  };

  res.json(response);
});