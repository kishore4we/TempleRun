import {Router, Response} from 'express';
import {body} from 'express-validator';
import {v4 as uuidv4} from 'uuid';
import {validateRequest} from '../middleware/validation';
import {optionalAuth, AuthRequest} from '../middleware/auth';
import {GameSessionModel} from '../models/GameSession';
import {UserModel} from '../models/User';
import {addToLeaderboard} from '../config/redis';

const router = Router();

// Start game session
router.post(
  '/start',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionId = uuidv4();
      const userId = req.user?.userId;

      await GameSessionModel.create(sessionId, userId);

      res.json({
        success: true,
        data: {sessionId},
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// End game session
router.post(
  '/end',
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('score').isInt({min: 0}).withMessage('Invalid score'),
    body('coins').isInt({min: 0}).withMessage('Invalid coins'),
    body('distance').isNumeric().withMessage('Invalid distance'),
  ],
  validateRequest,
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const {sessionId, score, coins, distance} = req.body;

      // Update game session
      await GameSessionModel.end(sessionId, score, coins, distance);

      // Update user stats if authenticated
      if (req.user?.userId) {
        await UserModel.updateStats(req.user.userId, score, coins);

        // Update leaderboard in Redis
        await addToLeaderboard(req.user.userId, score);
      }

      res.json({
        success: true,
        message: 'Game session ended successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Get user stats
router.get('/stats', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const stats = await GameSessionModel.getUserStats(req.user.userId);
    const user = await UserModel.findById(req.user.userId);

    res.json({
      success: true,
      data: {
        ...stats,
        currentHighScore: user?.high_score || 0,
        currentTotalCoins: user?.total_coins || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
