import {Router, Response} from 'express';
import {body} from 'express-validator';
import {validateRequest} from '../middleware/validation';
import {authenticate, AuthRequest} from '../middleware/auth';
import {UserModel} from '../models/User';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({min: 3, max: 20})
      .withMessage('Username must be 3-20 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password')
      .isLength({min: 6})
      .withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const {username, email, password} = req.body;

      // Check if user exists
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        res.status(400).json({
          success: false,
          error: 'Email already registered',
        });
        return;
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        res.status(400).json({
          success: false,
          error: 'Username already taken',
        });
        return;
      }

      // Create user
      const user = await UserModel.create(username, email, password);

      // Generate tokens
      const token = generateToken({userId: user.id, email: user.email});
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      res.status(201).json({
        success: true,
        data: {
          user: UserModel.toPublic(user),
          token,
          refreshToken,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const {email, password} = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      // Verify password
      const isValid = await UserModel.verifyPassword(user, password);
      if (!isValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      // Generate tokens
      const token = generateToken({userId: user.id, email: user.email});
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      res.json({
        success: true,
        data: {
          user: UserModel.toPublic(user),
          token,
          refreshToken,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Refresh token
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const {refreshToken} = req.body;

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Generate new access token
      const token = generateToken({
        userId: payload.userId,
        email: payload.email,
      });

      res.json({
        success: true,
        data: {token},
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  },
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: UserModel.toPublic(user),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
