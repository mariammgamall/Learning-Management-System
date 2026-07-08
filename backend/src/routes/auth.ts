import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Role } from '../types';
import rateLimit from 'express-rate-limit';
import { loginSchema, registerSchema, signupSchema, strongPassword } from '../models/validation';
import { authGuard, roleGuard, AuthenticatedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();
const router = Router();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_for_development_purposes_only_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_for_development_purposes_only_12345';

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Access token generator
function generateAccessToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

// Refresh token generator
function generateRefreshToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// @route   POST /api/v1/auth/login
// @desc    Log in user & set refresh cookie
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or deactivated account' });
    }

    const passwordMatch = await bcrypt.compare(body.password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id, user.role as Role);
    const refreshToken = generateRefreshToken(user.id, user.role as Role);

    // Set refresh token in httpOnly secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // standard lax same-site
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/auth/register
// @desc    Admin creates/registers new users
router.post('/register', authGuard, roleGuard(Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash the password (bcrypt rounds = 12)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
        role: body.role,
        isActive: true,
      },
    });

    return res.status(201).json({
      message: `Successfully registered user ${newUser.name} with role ${newUser.role}`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profilePhoto: newUser.profilePhoto,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/auth/refresh
// @desc    Silent token refresh using httpOnly refresh token cookie
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Read refreshToken from cookies
    const cookieString = req.headers.cookie || '';
    const cookies = Object.fromEntries(
      cookieString.split(';').map((c) => c.trim().split('='))
    );
    const refreshToken = cookies['refreshToken'];

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token cookie is missing' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string; role: Role };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    // Generate new short-lived access token
    const newAccessToken = generateAccessToken(user.id, user.role as Role);

    return res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// @route   POST /api/v1/auth/signup
// @desc    Public registration for new users
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const body = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
        role: body.role,
        isActive: true,
      },
    });

    return res.status(201).json({
      message: `Successfully registered. You can now log in.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profilePhoto: newUser.profilePhoto,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors[0]?.message || 'Validation failed', errors: error.errors });
    }
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/auth/forgot-password
// @desc    Initiate password reset (Generate code)
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate a 6-digit code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    console.log(`[DEMO PASSWORD RESET] Code for ${email}: ${resetToken}`);

    return res.status(200).json({
      message: 'Password reset code generated.',
      resetToken, // Return for demo convenience
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/auth/reset-password
// @desc    Reset password using reset token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, resetToken, password } = req.body;

    if (!email || !resetToken || !password) {
      return res.status(400).json({ message: 'Email, reset code, and new password are required' });
    }

    // Validate password complexity
    const passwordValidation = strongPassword.safeParse(password);
    if (!passwordValidation.success) {
      return res.status(400).json({ message: passwordValidation.error.errors[0]?.message || 'Weak password' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.resetToken !== resetToken) {
      return res.status(400).json({ message: 'Invalid email or reset code' });
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    // Update password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/auth/logout
// @desc    Clear refresh token cookie
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.status(200).json({ message: 'Successfully logged out' });
});

export default router;
