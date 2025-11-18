import {query} from '../config/database';

export interface GameSession {
  id: string;
  user_id: string | null;
  session_id: string;
  score: number;
  coins_collected: number;
  distance_traveled: number;
  started_at: Date;
  ended_at: Date | null;
  created_at: Date;
}

export class GameSessionModel {
  static async create(
    sessionId: string,
    userId?: string,
  ): Promise<GameSession> {
    const result = await query(
      `INSERT INTO game_sessions (session_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [sessionId, userId || null],
    );

    return result.rows[0];
  }

  static async findBySessionId(sessionId: string): Promise<GameSession | null> {
    const result = await query(
      'SELECT * FROM game_sessions WHERE session_id = $1',
      [sessionId],
    );
    return result.rows[0] || null;
  }

  static async end(
    sessionId: string,
    score: number,
    coins: number,
    distance: number,
  ): Promise<void> {
    await query(
      `UPDATE game_sessions
       SET score = $2,
           coins_collected = $3,
           distance_traveled = $4,
           ended_at = NOW()
       WHERE session_id = $1`,
      [sessionId, score, coins, distance],
    );
  }

  static async getUserStats(userId: string): Promise<any> {
    const result = await query(
      `SELECT
         COUNT(*) as total_games,
         MAX(score) as highest_score,
         SUM(coins_collected) as total_coins,
         SUM(distance_traveled) as total_distance,
         AVG(score) as average_score
       FROM game_sessions
       WHERE user_id = $1 AND ended_at IS NOT NULL`,
      [userId],
    );

    return result.rows[0];
  }
}
