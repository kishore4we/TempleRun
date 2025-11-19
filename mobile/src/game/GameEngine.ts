import {Player, Obstacle, Coin, PowerUp, GameObject, Direction} from '../types';

export const GAME_CONFIG = {
  LANES: 3,
  LANE_WIDTH: 100,
  PLAYER_SIZE: {width: 40, height: 60},
  OBSTACLE_SIZE: {width: 80, height: 80},
  COIN_SIZE: {width: 30, height: 30},
  POWERUP_SIZE: {width: 40, height: 40},
  INITIAL_SPEED: 6,
  MAX_SPEED: 18,
  SPEED_INCREMENT: 0.15,
  JUMP_VELOCITY: -18,
  GRAVITY: 1.0,
  GROUND_Y: 500,
  SPAWN_DISTANCE: 800,
  MIN_OBSTACLE_GAP: 250,
  POWERUP_SPAWN_CHANCE: 0.08,
  COIN_SPAWN_CHANCE: 0.6,
};

export interface ActivePowerUp {
  type: 'magnet' | 'shield' | 'multiplier' | 'boost';
  remainingTime: number;
}

export class GameEngine {
  private player: Player;
  private obstacles: Obstacle[] = [];
  private coins: Coin[] = [];
  private powerups: PowerUp[] = [];
  private speed: number = GAME_CONFIG.INITIAL_SPEED;
  private distance: number = 0;
  private lastObstacleZ: number = 0;
  private activePowerUps: ActivePowerUp[] = [];
  private scoreMultiplier: number = 1;

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

  public getActivePowerUps(): ActivePowerUp[] {
    return this.activePowerUps;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getDistance(): number {
    return this.distance;
  }

  public getMultiplier(): number {
    return this.scoreMultiplier;
  }

  public hasShield(): boolean {
    return this.activePowerUps.some(p => p.type === 'shield');
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
        if (!this.player.isSliding && this.player.position.y >= GAME_CONFIG.GROUND_Y - 10) {
          this.player.isSliding = true;
          this.player.size = {width: 40, height: 30}; // Shrink hitbox when sliding
          setTimeout(() => {
            this.player.isSliding = false;
            this.player.size = GAME_CONFIG.PLAYER_SIZE;
          }, 600);
        }
        break;
    }
  }

  public update(deltaTime: number): {
    coinsCollected: number;
    collision: boolean;
    distanceTraveled: number;
    powerUpCollected: string | null;
  } {
    let coinsCollected = 0;
    let collision = false;
    let powerUpCollected: string | null = null;

    // Update active power-ups
    this.updatePowerUps(deltaTime);

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

    // Calculate effective speed (boost power-up)
    const effectiveSpeed = this.activePowerUps.some(p => p.type === 'boost')
      ? this.speed * 1.5
      : this.speed;

    // Update distance
    const distanceDelta = effectiveSpeed * deltaTime;
    this.distance += distanceDelta;

    // Increase speed over time
    if (Math.floor(this.distance) % 50 === 0 && this.distance > 0) {
      this.speed = Math.min(
        this.speed + GAME_CONFIG.SPEED_INCREMENT,
        GAME_CONFIG.MAX_SPEED,
      );
    }

    // Generate game objects
    this.generateObstacles();

    // Check for magnet effect
    const hasMagnet = this.activePowerUps.some(p => p.type === 'magnet');

    // Update and check obstacles
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.position.y -= effectiveSpeed;

      if (obstacle.position.y < -100) {
        return false;
      }

      // Collision detection
      if (this.checkCollision(this.player, obstacle)) {
        if (!this.canAvoidObstacle(obstacle)) {
          // Check for shield
          if (this.hasShield()) {
            // Remove shield
            this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'shield');
            return false; // Destroy obstacle
          } else {
            collision = true;
          }
        }
      }

      return true;
    });

    // Update and collect coins
    this.coins = this.coins.filter(coin => {
      coin.position.y -= effectiveSpeed;

      if (coin.position.y < -100) {
        return false;
      }

      // Magnet effect - attract coins
      if (hasMagnet) {
        const dx = this.player.position.x - coin.position.x;
        const dy = this.player.position.y - coin.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          coin.position.x += dx * 0.15;
          coin.position.y += dy * 0.15;
        }
      }

      // Coin collection
      if (this.checkCollision(this.player, coin)) {
        coinsCollected += coin.value * this.scoreMultiplier;
        return false;
      }

      return true;
    });

    // Update and collect powerups
    this.powerups = this.powerups.filter(powerup => {
      powerup.position.y -= effectiveSpeed;

      if (powerup.position.y < -100) {
        return false;
      }

      // Power-up collection
      if (this.checkCollision(this.player, powerup)) {
        this.activatePowerUp(powerup);
        powerUpCollected = powerup.powerType;
        return false;
      }

      return true;
    });

    return {coinsCollected, collision, distanceTraveled: distanceDelta, powerUpCollected};
  }

  private updatePowerUps(deltaTime: number): void {
    this.activePowerUps = this.activePowerUps.filter(powerUp => {
      powerUp.remainingTime -= deltaTime * 1000;
      return powerUp.remainingTime > 0;
    });

    // Update multiplier
    this.scoreMultiplier = this.activePowerUps.some(p => p.type === 'multiplier') ? 2 : 1;
  }

  private activatePowerUp(powerup: PowerUp): void {
    // Remove existing power-up of same type
    this.activePowerUps = this.activePowerUps.filter(p => p.type !== powerup.powerType);

    this.activePowerUps.push({
      type: powerup.powerType,
      remainingTime: powerup.duration,
    });
  }

  private generateObstacles(): void {
    const currentZ = this.distance;

    if (currentZ - this.lastObstacleZ > GAME_CONFIG.MIN_OBSTACLE_GAP) {
      const shouldSpawnObstacle = Math.random() > 0.25;
      const shouldSpawnCoin = Math.random() < GAME_CONFIG.COIN_SPAWN_CHANCE;
      const shouldSpawnPowerUp = Math.random() < GAME_CONFIG.POWERUP_SPAWN_CHANCE;

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

      // Spawn coins in patterns
      if (shouldSpawnCoin) {
        const lane = Math.floor(Math.random() * GAME_CONFIG.LANES);
        const coinCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < coinCount; i++) {
          this.coins.push({
            id: `coin-${Date.now()}-${Math.random()}-${i}`,
            type: 'coin',
            value: 1,
            position: {
              x: lane * GAME_CONFIG.LANE_WIDTH,
              y: GAME_CONFIG.SPAWN_DISTANCE + i * 40,
            },
            size: GAME_CONFIG.COIN_SIZE,
            lane,
          });
        }
      }

      // Spawn power-ups
      if (shouldSpawnPowerUp) {
        const lane = Math.floor(Math.random() * GAME_CONFIG.LANES);
        const powerTypes: Array<'magnet' | 'shield' | 'multiplier' | 'boost'> = [
          'magnet',
          'shield',
          'multiplier',
          'boost',
        ];
        const powerType = powerTypes[Math.floor(Math.random() * powerTypes.length)];

        this.powerups.push({
          id: `powerup-${Date.now()}-${Math.random()}`,
          type: 'powerup',
          powerType,
          duration: 5000, // 5 seconds
          position: {x: lane * GAME_CONFIG.LANE_WIDTH, y: GAME_CONFIG.SPAWN_DISTANCE},
          size: GAME_CONFIG.POWERUP_SIZE,
          lane,
        });
      }
    }
  }

  private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    const tolerance = 10; // Small tolerance for better gameplay feel
    return (
      Math.abs(obj1.position.x - obj2.position.x) < (obj1.size.width + obj2.size.width) / 2 - tolerance &&
      Math.abs(obj1.position.y - obj2.position.y) < (obj1.size.height + obj2.size.height) / 2 - tolerance
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
    this.activePowerUps = [];
    this.speed = GAME_CONFIG.INITIAL_SPEED;
    this.distance = 0;
    this.lastObstacleZ = 0;
    this.scoreMultiplier = 1;
  }
}
