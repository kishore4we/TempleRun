import {Player, Obstacle, Coin, PowerUp, GameObject, Direction} from '../types';

export const GAME_CONFIG = {
  LANES: 3,
  LANE_WIDTH: 100,
  PLAYER_SIZE: {width: 40, height: 60},
  OBSTACLE_SIZE: {width: 80, height: 80},
  COIN_SIZE: {width: 30, height: 30},
  INITIAL_SPEED: 5,
  MAX_SPEED: 15,
  SPEED_INCREMENT: 0.1,
  SPEED_INCREMENT_INTERVAL: 1000, // Every 1 second
  JUMP_VELOCITY: -15,
  GRAVITY: 0.8,
  GROUND_Y: 500,
  SPAWN_DISTANCE: 800,
  MIN_OBSTACLE_GAP: 300,
};

export class GameEngine {
  private player: Player;
  private obstacles: Obstacle[] = [];
  private coins: Coin[] = [];
  private powerups: PowerUp[] = [];
  private speed: number = GAME_CONFIG.INITIAL_SPEED;
  private distance: number = 0;
  private lastObstacleZ: number = 0;
  private gameObjects: Map<string, GameObject> = new Map();

  constructor() {
    this.player = this.createPlayer();
  }

  private createPlayer(): Player {
    return {
      id: 'player',
      type: 'player',
      position: {x: GAME_CONFIG.LANE_WIDTH, y: GAME_CONFIG.GROUND_Y},
      size: GAME_CONFIG.PLAYER_SIZE,
      velocity: {x: 0, y: 0},
      lane: 1,
      isJumping: false,
      isSliding: false,
    };
  }

  public getPlayer(): Player {
    return this.player;
  }

  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  public getCoins(): Coin[] {
    return this.coins;
  }

  public getPowerUps(): PowerUp[] {
    return this.powerups;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getDistance(): number {
    return this.distance;
  }

  public handleSwipe(direction: Direction): void {
    switch (direction) {
      case Direction.LEFT:
        if (this.player.lane > 0) {
          this.player.lane -= 1;
          this.player.position.x = this.player.lane * GAME_CONFIG.LANE_WIDTH;
        }
        break;
      case Direction.RIGHT:
        if (this.player.lane < GAME_CONFIG.LANES - 1) {
          this.player.lane += 1;
          this.player.position.x = this.player.lane * GAME_CONFIG.LANE_WIDTH;
        }
        break;
      case Direction.UP:
        if (!this.player.isJumping && !this.player.isSliding) {
          this.player.isJumping = true;
          this.player.velocity!.y = GAME_CONFIG.JUMP_VELOCITY;
        }
        break;
      case Direction.DOWN:
        if (!this.player.isSliding && this.player.position.y === GAME_CONFIG.GROUND_Y) {
          this.player.isSliding = true;
          setTimeout(() => {
            this.player.isSliding = false;
          }, 500);
        }
        break;
    }
  }

  public update(deltaTime: number): {
    coinsCollected: number;
    collision: boolean;
    distanceTraveled: number;
  } {
    let coinsCollected = 0;
    let collision = false;

    // Update player physics
    if (this.player.isJumping) {
      this.player.velocity!.y += GAME_CONFIG.GRAVITY;
      this.player.position.y += this.player.velocity!.y;

      if (this.player.position.y >= GAME_CONFIG.GROUND_Y) {
        this.player.position.y = GAME_CONFIG.GROUND_Y;
        this.player.velocity!.y = 0;
        this.player.isJumping = false;
      }
    }

    // Update distance
    const distanceDelta = this.speed * deltaTime;
    this.distance += distanceDelta;

    // Increase speed over time
    if (Math.floor(this.distance) % 100 === 0) {
      this.speed = Math.min(
        this.speed + GAME_CONFIG.SPEED_INCREMENT,
        GAME_CONFIG.MAX_SPEED,
      );
    }

    // Generate obstacles
    this.generateObstacles();

    // Update and check obstacles
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.position.y -= this.speed;

      if (obstacle.position.y < -100) {
        return false;
      }

      // Collision detection
      if (this.checkCollision(this.player, obstacle)) {
        if (!this.canAvoidObstacle(obstacle)) {
          collision = true;
        }
      }

      return true;
    });

    // Update and collect coins
    this.coins = this.coins.filter(coin => {
      coin.position.y -= this.speed;

      if (coin.position.y < -100) {
        return false;
      }

      // Coin collection
      if (this.checkCollision(this.player, coin)) {
        coinsCollected += coin.value;
        return false;
      }

      return true;
    });

    // Update powerups
    this.powerups = this.powerups.filter(powerup => {
      powerup.position.y -= this.speed;
      return powerup.position.y > -100;
    });

    return {coinsCollected, collision, distanceTraveled: distanceDelta};
  }

  private generateObstacles(): void {
    const currentZ = this.distance;

    if (currentZ - this.lastObstacleZ > GAME_CONFIG.MIN_OBSTACLE_GAP) {
      const shouldSpawnObstacle = Math.random() > 0.3;
      const shouldSpawnCoin = Math.random() > 0.5;

      if (shouldSpawnObstacle) {
        const lane = Math.floor(Math.random() * GAME_CONFIG.LANES);
        const obstacleTypes: Array<'wall' | 'gap' | 'barrier' | 'low' | 'high'> = [
          'wall',
          'barrier',
          'low',
          'high',
        ];
        const obstacleType =
          obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

        this.obstacles.push({
          id: `obstacle-${Date.now()}-${Math.random()}`,
          type: 'obstacle',
          obstacleType,
          position: {x: lane * GAME_CONFIG.LANE_WIDTH, y: GAME_CONFIG.SPAWN_DISTANCE},
          size: GAME_CONFIG.OBSTACLE_SIZE,
          lane,
        });

        this.lastObstacleZ = currentZ;
      }

      if (shouldSpawnCoin) {
        const lane = Math.floor(Math.random() * GAME_CONFIG.LANES);
        this.coins.push({
          id: `coin-${Date.now()}-${Math.random()}`,
          type: 'coin',
          value: 1,
          position: {x: lane * GAME_CONFIG.LANE_WIDTH, y: GAME_CONFIG.SPAWN_DISTANCE},
          size: GAME_CONFIG.COIN_SIZE,
          lane,
        });
      }
    }
  }

  private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    return (
      Math.abs(obj1.position.x - obj2.position.x) < (obj1.size.width + obj2.size.width) / 2 &&
      Math.abs(obj1.position.y - obj2.position.y) < (obj1.size.height + obj2.size.height) / 2
    );
  }

  private canAvoidObstacle(obstacle: Obstacle): boolean {
    if (obstacle.obstacleType === 'low' && this.player.isJumping) {
      return true;
    }
    if (obstacle.obstacleType === 'high' && this.player.isSliding) {
      return true;
    }
    return false;
  }

  public reset(): void {
    this.player = this.createPlayer();
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.speed = GAME_CONFIG.INITIAL_SPEED;
    this.distance = 0;
    this.lastObstacleZ = 0;
  }
}
