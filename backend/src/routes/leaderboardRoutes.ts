import {Router, Response} from 'express';
import {query} from '../config/database';
import {getLeaderboard, getUserRank} from '../config/redis';
import {optionalAuth, AuthRequest} from '../middleware/auth';

const router = Router();

// Get global leaderboard
router.get('/global', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    // Try to get from Redis cache first
    let leaderboard = await getLeaderboard(limit);

    if (leaderboard.length === 0) {
      // Fallback to database
      const result = await query(
        `SELECT
           u.id as user_id,
           u.username,
           u.high_score as score
         FROM users u
         WHERE u.high_score > 0
         ORDER BY u.high_score DESC
         LIMIT $1`,
        [limit],
      );

      leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        userId: row.user_id,
        username: row.username,
        score: row.score,
        timestamp: new Date().toISOString(),
      }));
    } else {
      // Enrich Redis data with usernames
      const userIds = leaderboard.map(l => l.userId);
      const result = await query(
        `SELECT id, username FROM users WHERE id = ANY($1::uuid[])`,
        [userIds],
      );

      const userMap = new Map(result.rows.map(u => [u.id, u.username]));

      leaderboard = leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        username: userMap.get(entry.userId) || 'Unknown',
        score: entry.score,
        timestamp: new Date().toISOString(),
      }));
    }

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get friends leaderboard (requires auth)
router.get(
  '/friends',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // For now, return empty array (friends system not implemented)
      // In production, this would query a friends table
      res.json({
        success: true,
        data: [],
        message: 'Friends system not yet implemented',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Get user's rank
router.get('/rank', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const rank = await getUserRank(req.user.userId);

    res.json({
      success: true,
      data: {
        userId: req.user.userId,
        rank: rank || null,
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
