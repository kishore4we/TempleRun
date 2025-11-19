import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  PanResponder,
  Animated,
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

  // Animation refs
  const bird1Anim = useRef(new Animated.Value(0)).current;
  const bird2Anim = useRef(new Animated.Value(0)).current;
  const bird3Anim = useRef(new Animated.Value(0)).current;
  const cloud1Anim = useRef(new Animated.Value(0)).current;
  const cloud2Anim = useRef(new Animated.Value(0)).current;
  const tree1Anim = useRef(new Animated.Value(0)).current;
  const tree2Anim = useRef(new Animated.Value(0)).current;
  const playerBounce = useRef(new Animated.Value(0)).current;
  const coinGlow = useRef(new Animated.Value(0)).current;

  const isPausedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isGameOverRef = useRef(false);

  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  // Start all animations
  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Flying birds
    Animated.loop(
      Animated.timing(bird1Anim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(bird2Anim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(bird3Anim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();

    // Clouds
    Animated.loop(
      Animated.timing(cloud1Anim, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(cloud2Anim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Swaying trees
    Animated.loop(
      Animated.sequence([
        Animated.timing(tree1Anim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(tree1Anim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(tree2Anim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(tree2Anim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Player bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(playerBounce, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(playerBounce, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Coin glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(coinGlow, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(coinGlow, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

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
      magnet: '🧲 MAGNET POWER!',
      shield: '🛡️ SHIELD ACTIVATED!',
      multiplier: '✨ DOUBLE COINS!',
      boost: '⚡ SPEED BOOST!',
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
      '🦁 JUNGLE RUN OVER! 🦁',
      `🏆 Score: ${gameState.score}\n💎 Gems: ${gameState.coins}\n📏 Distance: ${Math.floor(gameState.distance)}m`,
      [
        {text: 'Home', onPress: () => navigation.goBack()},
        {
          text: 'Run Again!',
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
      wall: '🦁',
      barrier: '🐘',
      low: '🐍',
      high: '🦅',
    };
    return emojis[type] || '🦁';
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

  const renderAnimatedBackground = () => {
    const bird1X = bird1Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, width + 50],
    });
    const bird2X = bird2Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [width + 50, -50],
    });
    const bird3X = bird3Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-30, width + 30],
    });
    const cloud1X = cloud1Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, width + 100],
    });
    const cloud2X = cloud2Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [width + 100, -100],
    });
    const tree1Rotate = tree1Anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['-5deg', '5deg'],
    });
    const tree2Rotate = tree2Anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['5deg', '-5deg'],
    });

    return (
      <>
        {/* Animated clouds */}
        <Animated.Text style={[styles.cloud, {transform: [{translateX: cloud1X}], top: 20}]}>
          ☁️
        </Animated.Text>
        <Animated.Text style={[styles.cloud, {transform: [{translateX: cloud2X}], top: 50}]}>
          ☁️
        </Animated.Text>

        {/* Flying birds */}
        <Animated.Text style={[styles.flyingBird, {transform: [{translateX: bird1X}], top: 80}]}>
          🦜
        </Animated.Text>
        <Animated.Text style={[styles.flyingBird, {transform: [{translateX: bird2X}], top: 100}]}>
          🦅
        </Animated.Text>
        <Animated.Text style={[styles.flyingBird, {transform: [{translateX: bird3X}], top: 60}]}>
          🦋
        </Animated.Text>

        {/* Left jungle trees - animated */}
        <View style={styles.leftJungle}>
          <Animated.Text style={[styles.jungleTree, {transform: [{rotate: tree1Rotate}]}]}>
            🌴
          </Animated.Text>
          <Text style={styles.jungleTree}>🌳</Text>
          <Animated.Text style={[styles.jungleTree, {transform: [{rotate: tree2Rotate}]}]}>
            🌴
          </Animated.Text>
          <Text style={styles.jungleTree}>🌿</Text>
          <Text style={styles.jungleAnimal}>🦎</Text>
          <Text style={styles.jungleTree}>🌳</Text>
        </View>

        {/* Right jungle trees - animated */}
        <View style={styles.rightJungle}>
          <Animated.Text style={[styles.jungleTree, {transform: [{rotate: tree2Rotate}]}]}>
            🌴
          </Animated.Text>
          <Text style={styles.jungleTree}>🌳</Text>
          <Animated.Text style={[styles.jungleTree, {transform: [{rotate: tree1Rotate}]}]}>
            🌴
          </Animated.Text>
          <Text style={styles.jungleTree}>🌿</Text>
          <Text style={styles.jungleAnimal}>🐒</Text>
          <Text style={styles.jungleTree}>🌳</Text>
        </View>

        {/* Bottom vegetation */}
        <View style={styles.bottomVegetation}>
          <Text style={styles.vegetation}>🌿🌱🌿🌱🌿🌱🌿🌱🌿</Text>
        </View>
      </>
    );
  };

  const renderPlayer = () => {
    if (!engineRef.current) return null;
    const player = engineRef.current.getPlayer();
    const hasShield = engineRef.current.hasShield();

    const bounceY = playerBounce.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -5],
    });

    let emoji = '🏃‍♂️';
    if (player.isJumping) emoji = '🦸‍♂️';
    if (player.isSliding) emoji = '🏊‍♂️';

    return (
      <Animated.View
        style={[
          styles.player,
          {
            left: player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
            bottom: height - player.position.y - 200,
            transform: [{translateY: bounceY}],
          },
          hasShield ? styles.shielded : null,
        ]}>
        <Text style={styles.playerEmoji}>{emoji}</Text>
        {hasShield && <Text style={styles.shieldIcon}>🛡️</Text>}
      </Animated.View>
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
    const glowScale = coinGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    return engineRef.current.getCoins().map(coin => (
      <Animated.View
        key={coin.id}
        style={[
          styles.coin,
          {
            left: coin.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
            bottom: height - coin.position.y - 200,
            transform: [{scale: glowScale}],
          },
        ]}>
        <Text style={styles.coinEmoji}>💎</Text>
      </Animated.View>
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
      {/* Sky gradient */}
      <View style={styles.sky} />
      <View style={styles.skyGradient} />

      {/* Animated background elements */}
      {renderAnimatedBackground()}

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
          <Text style={styles.hudLabel}>🏆 SCORE</Text>
          <Text style={styles.hudValue}>{gameState.score}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>💎 GEMS</Text>
          <Text style={styles.hudValue}>{gameState.coins}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>📏 DIST</Text>
          <Text style={styles.hudValue}>{Math.floor(gameState.distance)}m</Text>
        </View>
      </View>

      {/* Multiplier */}
      {engineRef.current && engineRef.current.getMultiplier() > 1 && (
        <View style={styles.multiplier}>
          <Text style={styles.multiplierText}>🔥 2X 🔥</Text>
        </View>
      )}

      {/* Active power-ups */}
      {renderActivePowerUps()}

      {/* Pause button */}
      <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
        <Text style={styles.pauseBtnText}>{gameState.isPaused ? '▶️' : '⏸️'}</Text>
      </TouchableOpacity>

      {/* Pause overlay */}
      {gameState.isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseTitle}>🌴 JUNGLE PAUSED 🌴</Text>
          <Text style={styles.pauseSubtitle}>🦁 🐘 🦅 🐍</Text>
          <TouchableOpacity style={styles.menuBtn} onPress={handlePause}>
            <Text style={styles.menuBtnText}>▶️ RESUME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quitBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.quitBtnText}>🏠 QUIT</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a2f14',
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: '#87CEEB',
  },
  skyGradient: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#5ab078',
    opacity: 0.5,
  },
  cloud: {
    position: 'absolute',
    fontSize: 40,
  },
  flyingBird: {
    position: 'absolute',
    fontSize: 25,
  },
  leftJungle: {
    position: 'absolute',
    left: 2,
    top: 140,
    bottom: 40,
    justifyContent: 'space-around',
  },
  rightJungle: {
    position: 'absolute',
    right: 2,
    top: 140,
    bottom: 40,
    justifyContent: 'space-around',
  },
  jungleTree: {
    fontSize: 38,
  },
  jungleAnimal: {
    fontSize: 25,
  },
  bottomVegetation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  vegetation: {
    fontSize: 20,
  },
  road: {
    position: 'absolute',
    top: 100,
    bottom: 0,
    left: 45,
    right: 45,
    backgroundColor: '#4a3728',
    flexDirection: 'row',
    justifyContent: 'center',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderColor: '#2d1f14',
  },
  lane: {
    width: GAME_CONFIG.LANE_WIDTH,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#6b5344',
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
    fontSize: 42,
  },
  shielded: {
    backgroundColor: 'rgba(100, 200, 255, 0.5)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#64c8ff',
  },
  shieldIcon: {
    position: 'absolute',
    top: -8,
    fontSize: 20,
  },
  obstacle: {
    position: 'absolute',
    width: 65,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obstacleEmoji: {
    fontSize: 48,
  },
  coin: {
    position: 'absolute',
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 28,
  },
  powerUp: {
    position: 'absolute',
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 22,
  },
  powerUpEmoji: {
    fontSize: 30,
  },
  powerUpMsgBox: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  powerUpMsgText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  hud: {
    position: 'absolute',
    top: 45,
    left: 8,
    right: 55,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  hudLabel: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: 'bold',
  },
  hudValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  multiplier: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  multiplierText: {
    backgroundColor: '#FF4500',
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activePowerUps: {
    position: 'absolute',
    top: 100,
    left: 8,
    flexDirection: 'row',
  },
  activePowerUpItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  activePowerUpEmoji: {
    fontSize: 16,
  },
  pauseBtn: {
    position: 'absolute',
    top: 45,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  pauseBtnText: {
    fontSize: 18,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 47, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  pauseSubtitle: {
    fontSize: 30,
    marginBottom: 40,
  },
  menuBtn: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 45,
    borderRadius: 25,
    marginBottom: 15,
  },
  menuBtnText: {
    color: '#0a2f14',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quitBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 45,
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
