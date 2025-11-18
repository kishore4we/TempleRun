import {query} from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  high_score: number;
  total_coins: number;
  games_played: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  highScore: number;
  totalCoins: number;
  gamesPlayed: number;
  createdAt: string;
}

export class UserModel {
  static async create(
    username: string,
    email: string,
    password: string,
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [username, email, passwordHash],
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE username = $1', [
      username,
    ]);
    return result.rows[0] || null;
  }

  static async verifyPassword(
    user: User,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static async updateStats(
    userId: string,
    score: number,
    coins: number,
  ): Promise<void> {
    await query(
      `UPDATE users
       SET high_score = GREATEST(high_score, $2),
           total_coins = total_coins + $3,
           games_played = games_played + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, score, coins],
    );
  }

  static toPublic(user: User): UserPublic {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      highScore: user.high_score,
      totalCoins: user.total_coins,
      gamesPlayed: user.games_played,
      createdAt: user.created_at.toISOString(),
    };
  }
}
