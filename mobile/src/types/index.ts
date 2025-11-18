export interface User {
  id: string;
  username: string;
  email: string;
  highScore: number;
  totalCoins: number;
  gamesPlayed: number;
  createdAt: string;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  coins: number;
  distance: number;
  speed: number;
  lives: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameObject {
  id: string;
  type: 'player' | 'obstacle' | 'coin' | 'powerup';
  position: Position;
  size: Size;
  velocity?: Position;
}

export interface Player extends GameObject {
  type: 'player';
  lane: number; // 0 = left, 1 = center, 2 = right
  isJumping: boolean;
  isSliding: boolean;
}

export interface Obstacle extends GameObject {
  type: 'obstacle';
  obstacleType: 'wall' | 'gap' | 'barrier' | 'low' | 'high';
  lane: number;
}

export interface Coin extends GameObject {
  type: 'coin';
  value: number;
  lane: number;
}

export interface PowerUp extends GameObject {
  type: 'powerup';
  powerType: 'magnet' | 'shield' | 'multiplier' | 'boost';
  duration: number;
  lane: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  timestamp: string;
}

export interface GameSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  finalScore: number;
  coinsCollected: number;
  distanceTraveled: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export enum Direction {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
}

export interface SwipeGesture {
  direction: Direction;
  velocity: number;
}
