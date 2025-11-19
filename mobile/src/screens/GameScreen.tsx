import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  PanResponder,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

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

const GameScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const engineRef = useRef<GameEngine | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [, setRenderTrigger] = useState(0);
  const [powerUpMsg, setPowerUpMsg] = useState('');

  const isPausedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isGameOverRef = useRef(false);

  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

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

      if (engineRef.current) {
        const result = engineRef.current.update(deltaTime);

        if (result.coinsCollected > 0) {
          dispatch(collectCoin(result.coinsCollected));
        }

        if (result.distanceTraveled > 0) {
          dispatch(updateDistance(result.distanceTraveled));
        }

        if (result.powerUpCollected) {
          showPowerUp(result.powerUpCollected);
        }

        if (result.collision && !isGameOverRef.current) {
          isGameOverRef.current = true;
          handleGameOver();
          return;
        }
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

  const showPowerUp = (type: string) => {
    const msgs: Record<string, string> = {
      magnet: '🧲 MAGNET!',
      shield: '🛡️ SHIELD!',
      multiplier: '✨ 2X GEMS!',
      boost: '⚡ BOOST!',
    };
    setPowerUpMsg(msgs[type] || '');
    setTimeout(() => setPowerUpMsg(''), 1500);
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
    } catch (error) {}

    Alert.alert(
      '🌴 Game Over 🌴',
      `Score: ${gameState.score}\nGems: ${gameState.coins} 💎\nDistance: ${Math.floor(gameState.distance)}m`,
      [
        {text: 'Home', onPress: () => navigation.goBack()},
        {
          text: 'Play Again',
          onPress: () => {
            engineRef.current?.reset();
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const {dx, dy} = gestureState;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 30) engineRef.current?.handleSwipe(Direction.RIGHT);
          else if (dx < -30) engineRef.current?.handleSwipe(Direction.LEFT);
        } else {
          if (dy < -30) engineRef.current?.handleSwipe(Direction.UP);
          else if (dy > 30) engineRef.current?.handleSwipe(Direction.DOWN);
        }
      },
    })
  ).current;

  const getObstacleEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      wall: '🌴',
      barrier: '🪨',
      low: '🌿',
      high: '🦜',
    };
    return emojis[type] || '🌴';
  };

  const getPowerUpEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      magnet: '🧲',
      shield: '🛡️',
      multiplier: '✨',
      boost: '⚡',
    };
    return emojis[type] || '⭐';
  };

  const renderPlayer = () => {
    if (!engineRef.current) return null;
    const player = engineRef.current.getPlayer();
    const hasShield = engineRef.current.hasShield();

    let emoji = '🏃';
    if (player.isJumping) emoji = '🦘';
    if (player.isSliding) emoji = '🏃';

    return (
      <View
        style={[
          styles.player,
          {
            left: player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
            bottom: height - player.position.y - 200,
          },
          hasShield ? styles.shielded : null,
        ]}>
        <Text style={styles.playerEmoji}>{emoji}</Text>
        {hasShield && <Text style={styles.shieldIcon}>🛡️</Text>}
      </View>
    );
  };

  const renderObstacles = () => {
    if (!engineRef.current) return null;
    return engineRef.current.getObstacles().map(obstacle => (
      <View
        key={obstacle.id}
        style={[
          styles.obstacle,
          {
            left: obstacle.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
            bottom: height - obstacle.position.y - 200,
          },
        ]}>
        <Text style={styles.obstacleEmoji}>
          {getObstacleEmoji(obstacle.obstacleType)}
        </Text>
      </View>
    ));
  };

  const renderCoins = () => {
    if (!engineRef.current) return null;
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
        <Text style={styles.coinEmoji}>💎</Text>
      </View>
    ));
  };

  const renderPowerUps = () => {
    if (!engineRef.current) return null;
    return engineRef.current.getPowerUps().map(powerup => (
      <View
        key={powerup.id}
        style={[
          styles.powerUp,
          {
            left: powerup.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
            bottom: height - powerup.position.y - 200,
          },
        ]}>
        <Text style={styles.powerUpEmoji}>
          {getPowerUpEmoji(powerup.powerType)}
        </Text>
      </View>
    ));
  };

  const renderActivePowerUps = () => {
    if (!engineRef.current) return null;
    const active = engineRef.current.getActivePowerUps();
    if (active.length === 0) return null;

    return (
      <View style={styles.activePowerUps}>
        {active.map((p, i) => (
          <View key={i} style={styles.activePowerUpItem}>
            <Text style={styles.activePowerUpEmoji}>{getPowerUpEmoji(p.type)}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Sky */}
      <View style={styles.sky} />

      {/* Jungle sides */}
      <View style={styles.leftJungle}>
        <Text style={styles.jungleTree}>🌴</Text>
        <Text style={styles.jungleTree}>🌳</Text>
        <Text style={styles.jungleTree}>🌴</Text>
        <Text style={styles.jungleTree}>🌿</Text>
      </View>
      <View style={styles.rightJungle}>
        <Text style={styles.jungleTree}>🌴</Text>
        <Text style={styles.jungleTree}>🌳</Text>
        <Text style={styles.jungleTree}>🌴</Text>
        <Text style={styles.jungleTree}>🌿</Text>
      </View>

      {/* Road/Path */}
      <View style={styles.road}>
        <View style={styles.lane} />
        <View style={styles.lane} />
        <View style={styles.lane} />
      </View>

      {/* Game objects */}
      {renderPlayer()}
      {renderObstacles()}
      {renderCoins()}
      {renderPowerUps()}

      {/* Power-up message */}
      {powerUpMsg !== '' && (
        <View style={styles.powerUpMsgBox}>
          <Text style={styles.powerUpMsgText}>{powerUpMsg}</Text>
        </View>
      )}

      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudValue}>{gameState.score}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>💎 GEMS</Text>
          <Text style={styles.hudValue}>{gameState.coins}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>DISTANCE</Text>
          <Text style={styles.hudValue}>{Math.floor(gameState.distance)}m</Text>
        </View>
      </View>

      {/* Multiplier */}
      {engineRef.current && engineRef.current.getMultiplier() > 1 && (
        <View style={styles.multiplier}>
          <Text style={styles.multiplierText}>2X</Text>
        </View>
      )}

      {/* Active power-ups */}
      {renderActivePowerUps()}

      {/* Pause button */}
      <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
        <Text style={styles.pauseBtnText}>{gameState.isPaused ? '▶' : '⏸'}</Text>
      </TouchableOpacity>

      {/* Pause overlay */}
      {gameState.isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseTitle}>🌴 PAUSED 🌴</Text>
          <TouchableOpacity style={styles.menuBtn} onPress={handlePause}>
            <Text style={styles.menuBtnText}>RESUME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quitBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.quitBtnText}>QUIT</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d3d1f',
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#4a90a4',
  },
  leftJungle: {
    position: 'absolute',
    left: 5,
    top: 120,
    bottom: 50,
    justifyContent: 'space-around',
  },
  rightJungle: {
    position: 'absolute',
    right: 5,
    top: 120,
    bottom: 50,
    justifyContent: 'space-around',
  },
  jungleTree: {
    fontSize: 35,
    opacity: 0.8,
  },
  road: {
    position: 'absolute',
    top: 80,
    bottom: 0,
    left: 50,
    right: 50,
    backgroundColor: '#5c3d2e',
    flexDirection: 'row',
    justifyContent: 'center',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#3d2817',
  },
  lane: {
    width: GAME_CONFIG.LANE_WIDTH,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#7a5a4a',
    borderStyle: 'dashed',
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
  shielded: {
    backgroundColor: 'rgba(100, 200, 255, 0.4)',
    borderRadius: 25,
  },
  shieldIcon: {
    position: 'absolute',
    top: -5,
    fontSize: 18,
  },
  obstacle: {
    position: 'absolute',
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obstacleEmoji: {
    fontSize: 50,
  },
  coin: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 24,
  },
  powerUp: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  powerUpEmoji: {
    fontSize: 28,
  },
  powerUpMsgBox: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  powerUpMsgText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  hud: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  hudLabel: {
    color: '#88c999',
    fontSize: 9,
    fontWeight: 'bold',
  },
  hudValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  multiplier: {
    position: 'absolute',
    top: 95,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  multiplierText: {
    backgroundColor: '#FFD700',
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activePowerUps: {
    position: 'absolute',
    top: 95,
    left: 10,
    flexDirection: 'row',
  },
  activePowerUpItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  activePowerUpEmoji: {
    fontSize: 18,
  },
  pauseBtn: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 20,
  },
  pauseBtnText: {
    color: '#FFF',
    fontSize: 20,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 61, 31, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 40,
  },
  menuBtn: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginBottom: 15,
  },
  menuBtnText: {
    color: '#0d3d1f',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quitBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  quitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GameScreen;
