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

  const isPausedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isGameOverRef = useRef(false);

  // Initialize engine
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
      // Silent fail
    }

    Alert.alert(
      'Game Over',
      `Score: ${gameState.score}\nCoins: ${gameState.coins}\nDistance: ${Math.floor(gameState.distance)}m`,
      [
        {
          text: 'Home',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Play Again',
          onPress: () => {
            if (engineRef.current) {
              engineRef.current.reset();
            }
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

  // Simple pan responder for swipe detection
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const {dx, dy} = gestureState;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 30) {
            engineRef.current?.handleSwipe(Direction.RIGHT);
          } else if (dx < -30) {
            engineRef.current?.handleSwipe(Direction.LEFT);
          }
        } else {
          if (dy < -30) {
            engineRef.current?.handleSwipe(Direction.UP);
          } else if (dy > 30) {
            engineRef.current?.handleSwipe(Direction.DOWN);
          }
        }
      },
    })
  ).current;

  const renderPlayer = () => {
    if (!engineRef.current) return null;
    const player = engineRef.current.getPlayer();
    const leftPos = player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH;
    const bottomPos = height - player.position.y - 200;

    return (
      <View
        style={[
          styles.player,
          {
            left: leftPos,
            bottom: bottomPos,
          },
        ]}>
        <Text style={styles.emoji}>🏃</Text>
      </View>
    );
  };

  const renderObstacles = () => {
    if (!engineRef.current) return null;
    return engineRef.current.getObstacles().map(obstacle => {
      const leftPos = obstacle.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH;
      const bottomPos = height - obstacle.position.y - 200;

      return (
        <View
          key={obstacle.id}
          style={[
            styles.obstacle,
            {
              left: leftPos,
              bottom: bottomPos,
            },
          ]}>
          <Text style={styles.emoji}>🌴</Text>
        </View>
      );
    });
  };

  const renderCoins = () => {
    if (!engineRef.current) return null;
    return engineRef.current.getCoins().map(coin => {
      const leftPos = coin.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH;
      const bottomPos = height - coin.position.y - 200;

      return (
        <View
          key={coin.id}
          style={[
            styles.coin,
            {
              left: leftPos,
              bottom: bottomPos,
            },
          ]}>
          <Text style={styles.coinEmoji}>💎</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.gameArea}>
        {/* Road */}
        <View style={styles.road}>
          <View style={styles.lane} />
          <View style={styles.lane} />
          <View style={styles.lane} />
        </View>

        {/* Game objects */}
        {renderPlayer()}
        {renderObstacles()}
        {renderCoins()}

        {/* HUD */}
        <View style={styles.hud}>
          <Text style={styles.hudText}>Score: {gameState.score}</Text>
          <Text style={styles.hudText}>Coins: {gameState.coins}</Text>
          <Text style={styles.hudText}>
            {Math.floor(gameState.distance)}m
          </Text>
        </View>

        <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
          <Text style={styles.pauseButtonText}>
            {gameState.isPaused ? '▶' : '⏸'}
          </Text>
        </TouchableOpacity>

        {gameState.isPaused && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseTitle}>PAUSED</Text>
            <TouchableOpacity style={styles.menuButton} onPress={handlePause}>
              <Text style={styles.menuButtonText}>RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.menuButtonText}>QUIT</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a472a',
  },
  gameArea: {
    flex: 1,
  },
  road: {
    position: 'absolute',
    top: 100,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3d2817',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  lane: {
    width: GAME_CONFIG.LANE_WIDTH,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#5c4033',
  },
  player: {
    position: 'absolute',
    width: 50,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obstacle: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coin: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  coinEmoji: {
    fontSize: 25,
  },
  hud: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 5,
  },
  pauseButton: {
    position: 'absolute',
    top: 50,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  pauseButtonText: {
    color: '#FFF',
    fontSize: 20,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 30,
  },
  menuButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginBottom: 15,
  },
  menuButtonText: {
    color: '#1a472a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameScreen;
