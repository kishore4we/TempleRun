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
  GestureHandlerRootView,
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

const GameScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const engineRef = useRef<GameEngine>(new GameEngine());
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [renderTrigger, setRenderTrigger] = useState(0);

  useEffect(() => {
    initGame();
    return () => {
      stopGameLoop();
    };
  }, []);

  const initGame = async () => {
    try {
      const id = await gameService.startGameSession();
      setSessionId(id);
      dispatch(startGame());
      startGameLoop();
    } catch (error) {
      console.error('Failed to initialize game:', error);
      dispatch(startGame());
      startGameLoop();
    }
  };

  const startGameLoop = () => {
    let lastTime = Date.now();

    gameLoopRef.current = setInterval(() => {
      if (gameState.isPaused || !gameState.isPlaying) {
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

      if (result.collision) {
        handleGameOver();
      }

      setRenderTrigger(prev => prev + 1);
    }, 1000 / 60); // 60 FPS
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
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
      console.error('Failed to save game session:', error);
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
      const {translationX, translationY, velocityX, velocityY} = event;

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
    return (
      <View
        key="player"
        style={[
          styles.player,
          {
            left: player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
            bottom: height - player.position.y - 200,
          },
        ]}>
        <Text style={styles.playerEmoji}>🏃</Text>
      </View>
    );
  };

  const renderObstacles = () => {
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
        <Text style={styles.obstacleEmoji}>🧱</Text>
      </View>
    ));
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
        <Text style={styles.coinEmoji}>🪙</Text>
      </View>
    ));
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.gameArea}>
          {/* Road lanes */}
          <View style={styles.road}>
            {[0, 1, 2].map(lane => (
              <View key={lane} style={styles.lane} />
            ))}
          </View>

          {/* Game objects */}
          {renderPlayer()}
          {renderObstacles()}
          {renderCoins()}

          {/* HUD */}
          <View style={styles.hud}>
            <View style={styles.hudTop}>
              <Text style={styles.hudText}>Score: {gameState.score}</Text>
              <Text style={styles.hudText}>Coins: {gameState.coins}</Text>
              <Text style={styles.hudText}>
                Distance: {Math.floor(gameState.distance)}m
              </Text>
            </View>

            <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
              <Text style={styles.pauseButtonText}>
                {gameState.isPaused ? '▶' : '⏸'}
              </Text>
            </TouchableOpacity>
          </View>

          {gameState.isPaused && (
            <View style={styles.pauseOverlay}>
              <Text style={styles.pauseText}>PAUSED</Text>
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
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  road: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#555',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  lane: {
    width: GAME_CONFIG.LANE_WIDTH,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#FFD700',
  },
  player: {
    position: 'absolute',
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 40,
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
    fontSize: 30,
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  hudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5,
  },
  pauseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 30,
  },
  resumeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
  },
  resumeButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 40,
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
