import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';

import {RootState} from '../store';
import {
  startGame,
  endGame,
  pauseGame,
  resumeGame,
  collectCoin,
  updateDistance,
} from '../store/slices/gameSlice';
import {GameEngine, GAME_CONFIG} from '../game/GameEngine';
import {Direction} from '../types';
import gameService from '../services/gameService';

const {width, height} = Dimensions.get('window');

// Jungle themed emojis
const JUNGLE_EMOJIS: {
  player: string;
  playerJumping: string;
  playerSliding: string;
  obstacles: {[key: string]: string};
  coin: string;
  powerups: {[key: string]: string};
  decoration: string[];
} = {
  player: '🏃',
  playerJumping: '🦘',
  playerSliding: '🏃',
  obstacles: {
    wall: '🌴',
    barrier: '🪨',
    low: '🌿',
    high: '🦜',
    gap: '🕳️',
  },
  coin: '💎',
  powerups: {
    magnet: '🧲',
    shield: '🛡️',
    multiplier: '✨',
    boost: '⚡',
  },
  decoration: ['🌳', '🌴', '🌿', '🍃', '🦎', '🦋'],
};

const GameScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const engineRef = useRef<GameEngine>(new GameEngine());
  const gameLoopRef = useRef<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [powerUpMessage, setPowerUpMessage] = useState<string>('');

  // Use refs for values accessed in game loop to avoid closure issues
  const isPausedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isGameOverRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isPausedRef.current = gameState.isPaused;
    isPlayingRef.current = gameState.isPlaying;
  }, [gameState.isPaused, gameState.isPlaying]);

  useEffect(() => {
    initGame();
    return () => {
      stopGameLoop();
    };
  }, []);

  const initGame = async () => {
    isGameOverRef.current = false;
    const id = await gameService.startGameSession();
    setSessionId(id);
    dispatch(startGame());
    isPlayingRef.current = true;
    startGameLoop();
  };

  const startGameLoop = () => {
    let lastTime = Date.now();

    const loop = () => {
      if (isPausedRef.current || !isPlayingRef.current || isGameOverRef.current) {
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const result = engineRef.current.update(deltaTime);

      if (result.coinsCollected > 0) {
        dispatch(collectCoin(result.coinsCollected));
      }

      if (result.distanceTraveled > 0) {
        dispatch(updateDistance(result.distanceTraveled));
      }

      if (result.powerUpCollected) {
        showPowerUpMessage(result.powerUpCollected);
      }

      if (result.collision && !isGameOverRef.current) {
        isGameOverRef.current = true;
        handleGameOver();
        return;
      }

      setRenderTrigger(prev => prev + 1);
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  const showPowerUpMessage = (type: string) => {
    const messages: {[key: string]: string} = {
      magnet: '🧲 COIN MAGNET!',
      shield: '🛡️ SHIELD ACTIVE!',
      multiplier: '✨ 2X COINS!',
      boost: '⚡ SPEED BOOST!',
    };
    setPowerUpMessage(messages[type] || '');
    setTimeout(() => setPowerUpMessage(''), 2000);
  };

  const handleGameOver = async () => {
    stopGameLoop();
    dispatch(endGame());

    try {
      await gameService.endGameSession({
        sessionId,
        score: gameState.score,
        coins: gameState.coins,
        distance: gameState.distance,
      });
    } catch (error) {
      // Silent fail for offline play
    }

    Alert.alert(
      '🌴 Game Over 🌴',
      `Score: ${gameState.score}\nGems: ${gameState.coins} 💎\nDistance: ${Math.floor(gameState.distance)}m`,
      [
        {
          text: 'Home',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Play Again',
          onPress: () => {
            engineRef.current.reset();
            initGame();
          },
        },
      ],
    );
  };

  const handlePause = () => {
    if (gameState.isPaused) {
      dispatch(resumeGame());
    } else {
      dispatch(pauseGame());
    }
  };

  const swipeGesture = Gesture.Pan()
    .onEnd(event => {
      const {translationX, translationY} = event;

      if (Math.abs(translationX) > Math.abs(translationY)) {
        // Horizontal swipe
        if (translationX > 50) {
          engineRef.current.handleSwipe(Direction.RIGHT);
        } else if (translationX < -50) {
          engineRef.current.handleSwipe(Direction.LEFT);
        }
      } else {
        // Vertical swipe
        if (translationY < -50) {
          engineRef.current.handleSwipe(Direction.UP);
        } else if (translationY > 50) {
          engineRef.current.handleSwipe(Direction.DOWN);
        }
      }
    });

  const renderPlayer = () => {
    const player = engineRef.current.getPlayer();
    const hasShield = engineRef.current.hasShield();
    let emoji = JUNGLE_EMOJIS.player;
    if (player.isJumping) emoji = JUNGLE_EMOJIS.playerJumping;
    if (player.isSliding) emoji = JUNGLE_EMOJIS.playerSliding;

    return (
      <View
        key="player"
        style={[
          styles.player,
          {
            left: player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
            bottom: height - player.position.y - 200,
          },
          hasShield && styles.shieldActive,
        ]}>
        <Text style={styles.playerEmoji}>{emoji}</Text>
        {hasShield && <Text style={styles.shieldEmoji}>🛡️</Text>}
      </View>
    );
  };

  const renderObstacles = () => {
    return engineRef.current.getObstacles().map(obstacle => {
      const emoji = JUNGLE_EMOJIS.obstacles[obstacle.obstacleType] || '🌴';
      return (
        <View
          key={obstacle.id}
          style={[
            styles.obstacle,
            {
              left: obstacle.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
              bottom: height - obstacle.position.y - 200,
            },
          ]}>
          <Text style={styles.obstacleEmoji}>{emoji}</Text>
        </View>
      );
    });
  };

  const renderCoins = () => {
    return engineRef.current.getCoins().map(coin => (
      <View
        key={coin.id}
        style={[
          styles.coin,
          {
            left: coin.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
            bottom: height - coin.position.y - 200,
          },
        ]}>
        <Text style={styles.coinEmoji}>{JUNGLE_EMOJIS.coin}</Text>
      </View>
    ));
  };

  const renderPowerUps = () => {
    return engineRef.current.getPowerUps().map(powerup => {
      const emoji = JUNGLE_EMOJIS.powerups[powerup.powerType] || '⭐';
      return (
        <View
          key={powerup.id}
          style={[
            styles.powerup,
            {
              left: powerup.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
              bottom: height - powerup.position.y - 200,
            },
          ]}>
          <Text style={styles.powerupEmoji}>{emoji}</Text>
        </View>
      );
    });
  };

  const renderActivePowerUps = () => {
    const activePowerUps = engineRef.current.getActivePowerUps();
    if (activePowerUps.length === 0) return null;

    return (
      <View style={styles.activePowerUpsContainer}>
        {activePowerUps.map((powerUp, index) => (
          <View key={index} style={styles.activePowerUp}>
            <Text style={styles.activePowerUpEmoji}>
              {JUNGLE_EMOJIS.powerups[powerUp.type]}
            </Text>
            <View style={styles.powerUpTimer}>
              <View
                style={[
                  styles.powerUpTimerFill,
                  {width: `${(powerUp.remainingTime / 5000) * 100}%`},
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderJungleDecoration = () => {
    return (
      <>
        <View style={styles.leftJungle}>
          <Text style={styles.jungleEmoji}>🌴</Text>
          <Text style={styles.jungleEmoji}>🌳</Text>
          <Text style={styles.jungleEmoji}>🌿</Text>
        </View>
        <View style={styles.rightJungle}>
          <Text style={styles.jungleEmoji}>🌴</Text>
          <Text style={styles.jungleEmoji}>🌳</Text>
          <Text style={styles.jungleEmoji}>🌿</Text>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.gameArea}>
          {/* Sky gradient effect */}
          <View style={styles.sky} />

          {/* Jungle decoration */}
          {renderJungleDecoration()}

          {/* Road lanes - jungle path */}
          <View style={styles.road}>
            {[0, 1, 2].map(lane => (
              <View key={lane} style={styles.lane}>
                <View style={styles.laneMarker} />
              </View>
            ))}
          </View>

          {/* Game objects */}
          {renderPlayer()}
          {renderObstacles()}
          {renderCoins()}
          {renderPowerUps()}

          {/* Power-up message */}
          {powerUpMessage ? (
            <View style={styles.powerUpMessageContainer}>
              <Text style={styles.powerUpMessageText}>{powerUpMessage}</Text>
            </View>
          ) : null}

          {/* HUD */}
          <View style={styles.hud}>
            <View style={styles.hudTop}>
              <View style={styles.hudItem}>
                <Text style={styles.hudLabel}>SCORE</Text>
                <Text style={styles.hudValue}>{gameState.score}</Text>
              </View>
              <View style={styles.hudItem}>
                <Text style={styles.hudLabel}>GEMS 💎</Text>
                <Text style={styles.hudValue}>{gameState.coins}</Text>
              </View>
              <View style={styles.hudItem}>
                <Text style={styles.hudLabel}>DISTANCE</Text>
                <Text style={styles.hudValue}>{Math.floor(gameState.distance)}m</Text>
              </View>
            </View>

            {/* Multiplier indicator */}
            {engineRef.current.getMultiplier() > 1 && (
              <View style={styles.multiplierBadge}>
                <Text style={styles.multiplierText}>
                  {engineRef.current.getMultiplier()}X
                </Text>
              </View>
            )}

            {renderActivePowerUps()}

            <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
              <Text style={styles.pauseButtonText}>
                {gameState.isPaused ? '▶' : '⏸'}
              </Text>
            </TouchableOpacity>
          </View>

          {gameState.isPaused && (
            <View style={styles.pauseOverlay}>
              <Text style={styles.pauseTitle}>🌴 PAUSED 🌴</Text>
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={handlePause}>
                <Text style={styles.resumeButtonText}>RESUME</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quitButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.quitButtonText}>QUIT</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a472a', // Dark jungle green
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#87CEEB',
    opacity: 0.3,
  },
  leftJungle: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    justifyContent: 'space-around',
    paddingLeft: 5,
  },
  rightJungle: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    justifyContent: 'space-around',
    paddingRight: 5,
  },
  jungleEmoji: {
    fontSize: 30,
    opacity: 0.7,
  },
  road: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#3d2817', // Brown jungle path
    flexDirection: 'row',
    justifyContent: 'center',
  },
  lane: {
    width: GAME_CONFIG.LANE_WIDTH,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#5c4033',
    justifyContent: 'flex-end',
  },
  laneMarker: {
    height: '100%',
    borderStyle: 'dashed',
    borderLeftWidth: 1,
    borderColor: '#8b7355',
    marginLeft: '50%',
  },
  player: {
    position: 'absolute',
    width: 50,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 45,
  },
  shieldActive: {
    backgroundColor: 'rgba(100, 200, 255, 0.3)',
    borderRadius: 25,
  },
  shieldEmoji: {
    position: 'absolute',
    top: -10,
    fontSize: 20,
  },
  obstacle: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obstacleEmoji: {
    fontSize: 60,
  },
  coin: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 28,
  },
  powerup: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  powerupEmoji: {
    fontSize: 30,
  },
  powerUpMessageContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  powerUpMessageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 15,
    paddingTop: 40,
  },
  hudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  hudLabel: {
    color: '#88c999',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hudValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  multiplierBadge: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  multiplierText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activePowerUpsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  activePowerUp: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 8,
    marginRight: 10,
  },
  activePowerUpEmoji: {
    fontSize: 20,
  },
  powerUpTimer: {
    width: 30,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginTop: 3,
  },
  powerUpTimerFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  pauseButton: {
    position: 'absolute',
    top: 40,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 25,
  },
  pauseButtonText: {
    color: '#FFF',
    fontSize: 24,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 71, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 40,
  },
  resumeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginBottom: 15,
  },
  resumeButtonText: {
    color: '#1a472a',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  quitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default GameScreen;
