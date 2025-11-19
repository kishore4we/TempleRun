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
  Easing,
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

// Particle system for leaves
const NUM_LEAVES = 8;
const NUM_FIREFLIES = 6;
const NUM_DUST_PARTICLES = 5;

const GameScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const engineRef = useRef<GameEngine | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [, setRenderTrigger] = useState(0);
  const [powerUpMsg, setPowerUpMsg] = useState('');
  const [showSpeedLines, setShowSpeedLines] = useState(false);

  // Screen effects
  const screenShake = useRef(new Animated.Value(0)).current;
  const screenFlash = useRef(new Animated.Value(0)).current;

  // Parallax layers
  const parallaxFar = useRef(new Animated.Value(0)).current;
  const parallaxMid = useRef(new Animated.Value(0)).current;
  const parallaxNear = useRef(new Animated.Value(0)).current;

  // Sun and sky animations
  const sunGlow = useRef(new Animated.Value(0)).current;
  const sunRays = useRef(new Animated.Value(0)).current;
  const rainbowOpacity = useRef(new Animated.Value(0)).current;

  // Bird animations - more complex patterns
  const bird1Anim = useRef(new Animated.Value(0)).current;
  const bird1Y = useRef(new Animated.Value(0)).current;
  const bird2Anim = useRef(new Animated.Value(0)).current;
  const bird2Y = useRef(new Animated.Value(0)).current;
  const bird3Anim = useRef(new Animated.Value(0)).current;

  // Cloud animations
  const cloud1Anim = useRef(new Animated.Value(0)).current;
  const cloud2Anim = useRef(new Animated.Value(0)).current;
  const cloud3Anim = useRef(new Animated.Value(0)).current;

  // Tree animations
  const tree1Anim = useRef(new Animated.Value(0)).current;
  const tree2Anim = useRef(new Animated.Value(0)).current;
  const tree3Anim = useRef(new Animated.Value(0)).current;
  const tree4Anim = useRef(new Animated.Value(0)).current;

  // Player animations
  const playerBounce = useRef(new Animated.Value(0)).current;
  const playerScale = useRef(new Animated.Value(1)).current;
  const playerRotation = useRef(new Animated.Value(0)).current;
  const playerTrail = useRef(new Animated.Value(1)).current;

  // Coin and collectible animations
  const coinGlow = useRef(new Animated.Value(0)).current;
  const coinRotate = useRef(new Animated.Value(0)).current;

  // Particle animations
  const leafAnims = useRef(
    Array(NUM_LEAVES).fill(0).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotate: new Animated.Value(0),
    }))
  ).current;

  const fireflyAnims = useRef(
    Array(NUM_FIREFLIES).fill(0).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const dustAnims = useRef(
    Array(NUM_DUST_PARTICLES).fill(0).map(() => ({
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height - 200),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Obstacle warning
  const warningPulse = useRef(new Animated.Value(0)).current;

  const isPausedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isGameOverRef = useRef(false);

  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  // Start all animations
  useEffect(() => {
    startAllAnimations();
  }, []);

  const startAllAnimations = () => {
    // Sun glow pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sunGlow, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sun rays rotating
    Animated.loop(
      Animated.timing(sunRays, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Rainbow fade in/out
    Animated.loop(
      Animated.sequence([
        Animated.timing(rainbowOpacity, {
          toValue: 0.6,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(rainbowOpacity, {
          toValue: 0.2,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bird 1 - sine wave pattern
    Animated.loop(
      Animated.timing(bird1Anim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bird1Y, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bird1Y, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bird 2 - different pattern
    Animated.loop(
      Animated.timing(bird2Anim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bird2Y, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bird2Y, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bird 3 - fast flying
    Animated.loop(
      Animated.timing(bird3Anim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Clouds at different speeds
    Animated.loop(
      Animated.timing(cloud1Anim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(cloud2Anim, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(cloud3Anim, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Tree swaying with different patterns
    const createTreeSway = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: -1,
            duration: duration * 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createTreeSway(tree1Anim, 1500);
    createTreeSway(tree2Anim, 2000);
    createTreeSway(tree3Anim, 1800);
    createTreeSway(tree4Anim, 2200);

    // Player bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(playerBounce, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(playerBounce, {
          toValue: 0,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Coin rotation and glow
    Animated.loop(
      Animated.timing(coinRotate, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(coinGlow, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coinGlow, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Falling leaves
    leafAnims.forEach((leaf, index) => {
      const startLeafAnimation = () => {
        leaf.x.setValue(Math.random() * width);
        leaf.y.setValue(-50);
        leaf.rotate.setValue(0);

        Animated.parallel([
          Animated.timing(leaf.y, {
            toValue: height + 50,
            duration: 4000 + Math.random() * 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(leaf.x, {
            toValue: Math.random() * width,
            duration: 4000 + Math.random() * 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(leaf.rotate, {
            toValue: Math.random() > 0.5 ? 5 : -5,
            duration: 4000 + Math.random() * 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(startLeafAnimation, index * 500);
        });
      };

      setTimeout(startLeafAnimation, index * 800);
    });

    // Fireflies blinking
    fireflyAnims.forEach((firefly, index) => {
      const animateFirefly = () => {
        firefly.x.setValue(30 + Math.random() * (width - 60));
        firefly.y.setValue(150 + Math.random() * (height - 300));

        Animated.sequence([
          Animated.timing(firefly.opacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(firefly.opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(animateFirefly, Math.random() * 2000);
        });
      };

      setTimeout(animateFirefly, index * 500);
    });

    // Warning pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(warningPulse, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(warningPulse, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Parallax continuous scroll
    Animated.loop(
      Animated.timing(parallaxFar, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(parallaxMid, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(parallaxNear, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const triggerScreenShake = () => {
    Animated.sequence([
      Animated.timing(screenShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(screenShake, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(screenShake, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(screenShake, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(screenShake, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerScreenFlash = (color: string = 'white') => {
    Animated.sequence([
      Animated.timing(screenFlash, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(screenFlash, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerJumpAnimation = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(playerScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(playerScale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(playerScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(playerRotation, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(playerRotation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const triggerSlideAnimation = () => {
    Animated.sequence([
      Animated.timing(playerScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playerScale, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerDustEffect = () => {
    dustAnims.forEach((dust, index) => {
      dust.x.setValue(width / 2 + (Math.random() - 0.5) * 60);
      dust.y.setValue(height - 200);
      dust.opacity.setValue(0.8);

      Animated.parallel([
        Animated.timing(dust.y, {
          toValue: height - 250 - Math.random() * 50,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dust.x, {
          toValue: dust.x._value + (Math.random() - 0.5) * 100,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dust.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });
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
          triggerScreenFlash();
        }

        if (result.distanceTraveled > 0) {
          dispatch(updateDistance(result.distanceTraveled));
        }

        if (result.powerUpCollected) {
          showPowerUp(result.powerUpCollected);
          triggerScreenFlash();
          if (result.powerUpCollected === 'boost') {
            setShowSpeedLines(true);
            setTimeout(() => setShowSpeedLines(false), 3000);
          }
        }

        if (result.collision && !isGameOverRef.current) {
          isGameOverRef.current = true;
          triggerScreenShake();
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
          if (dx > 30) {
            engineRef.current?.handleSwipe(Direction.RIGHT);
            triggerDustEffect();
          } else if (dx < -30) {
            engineRef.current?.handleSwipe(Direction.LEFT);
            triggerDustEffect();
          }
        } else {
          if (dy < -30) {
            engineRef.current?.handleSwipe(Direction.UP);
            triggerJumpAnimation();
          } else if (dy > 30) {
            engineRef.current?.handleSwipe(Direction.DOWN);
            triggerSlideAnimation();
          }
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

  const renderSunAndSky = () => {
    const sunScale = sunGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    const raysRotation = sunRays.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <>
        {/* Sun with glow */}
        <Animated.View style={[styles.sunContainer, {transform: [{scale: sunScale}]}]}>
          <Animated.Text style={[styles.sunRays, {transform: [{rotate: raysRotation}]}]}>
            ✺
          </Animated.Text>
          <Text style={styles.sun}>☀️</Text>
        </Animated.View>

        {/* Rainbow */}
        <Animated.View style={[styles.rainbow, {opacity: rainbowOpacity}]}>
          <Text style={styles.rainbowText}>🌈</Text>
        </Animated.View>
      </>
    );
  };

  const renderAnimatedBackground = () => {
    // Bird interpolations with sine wave
    const bird1X = bird1Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, width + 50],
    });
    const bird1YMove = bird1Y.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -20],
    });

    const bird2X = bird2Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [width + 50, -50],
    });
    const bird2YMove = bird2Y.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 25],
    });

    const bird3X = bird3Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-30, width + 30],
    });

    // Cloud interpolations
    const cloud1X = cloud1Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, width + 100],
    });
    const cloud2X = cloud2Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [width + 100, -100],
    });
    const cloud3X = cloud3Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, width + 80],
    });

    // Tree rotations
    const tree1Rotate = tree1Anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-8deg', '0deg', '8deg'],
    });
    const tree2Rotate = tree2Anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['6deg', '0deg', '-6deg'],
    });
    const tree3Rotate = tree3Anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-7deg', '0deg', '7deg'],
    });
    const tree4Rotate = tree4Anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['5deg', '0deg', '-5deg'],
    });

    return (
      <>
        {/* Animated clouds - different sizes */}
        <Animated.Text style={[styles.cloudLarge, {transform: [{translateX: cloud1X}], top: 15}]}>
          ☁️
        </Animated.Text>
        <Animated.Text style={[styles.cloudMedium, {transform: [{translateX: cloud2X}], top: 45}]}>
          ☁️
        </Animated.Text>
        <Animated.Text style={[styles.cloudSmall, {transform: [{translateX: cloud3X}], top: 70}]}>
          ☁️
        </Animated.Text>

        {/* Flying birds with wave patterns */}
        <Animated.Text
          style={[
            styles.flyingBird,
            {
              transform: [{translateX: bird1X}, {translateY: bird1YMove}],
              top: 90
            }
          ]}>
          🦜
        </Animated.Text>
        <Animated.Text
          style={[
            styles.flyingBirdLarge,
            {
              transform: [{translateX: bird2X}, {translateY: bird2YMove}],
              top: 110
            }
          ]}>
          🦅
        </Animated.Text>
        <Animated.Text style={[styles.flyingBird, {transform: [{translateX: bird3X}], top: 65}]}>
          🦋
        </Animated.Text>

        {/* Left jungle - multiple layers for depth */}
        <View style={styles.leftJungleFar}>
          <Text style={styles.treeFar}>🌲</Text>
          <Text style={styles.treeFar}>🌲</Text>
        </View>

        <View style={styles.leftJungle}>
          <Animated.Text style={[styles.jungleTreeLarge, {transform: [{rotate: tree1Rotate}]}]}>
            🌴
          </Animated.Text>
          <Text style={styles.jungleTree}>🌳</Text>
          <Animated.Text style={[styles.jungleTreeLarge, {transform: [{rotate: tree3Rotate}]}]}>
            🌴
          </Animated.Text>
          <Text style={styles.jungleFern}>🌿</Text>
          <Text style={styles.jungleAnimal}>🦎</Text>
          <Text style={styles.jungleTree}>🌳</Text>
          <Text style={styles.jungleFlower}>🌺</Text>
        </View>

        {/* Right jungle - multiple layers */}
        <View style={styles.rightJungleFar}>
          <Text style={styles.treeFar}>🌲</Text>
          <Text style={styles.treeFar}>🌲</Text>
        </View>

        <View style={styles.rightJungle}>
          <Animated.Text style={[styles.jungleTreeLarge, {transform: [{rotate: tree2Rotate}]}]}>
            🌴
          </Animated.Text>
          <Text style={styles.jungleTree}>🌳</Text>
          <Animated.Text style={[styles.jungleTreeLarge, {transform: [{rotate: tree4Rotate}]}]}>
            🌴
          </Animated.Text>
          <Text style={styles.jungleFern}>🌿</Text>
          <Text style={styles.jungleAnimal}>🐒</Text>
          <Text style={styles.jungleTree}>🌳</Text>
          <Text style={styles.jungleFlower}>🌸</Text>
        </View>

        {/* Vines */}
        <Text style={[styles.vine, {left: 35}]}>🍃</Text>
        <Text style={[styles.vine, {right: 35, top: 200}]}>🍃</Text>

        {/* Bottom vegetation - more varied */}
        <View style={styles.bottomVegetation}>
          <Text style={styles.vegetationDense}>🌿🌱🍀🌿🌱🍀🌿🌱🍀</Text>
        </View>
      </>
    );
  };

  const renderParticles = () => {
    return (
      <>
        {/* Falling leaves */}
        {leafAnims.map((leaf, index) => {
          const rotate = leaf.rotate.interpolate({
            inputRange: [-5, 0, 5],
            outputRange: ['-180deg', '0deg', '180deg'],
          });

          return (
            <Animated.Text
              key={`leaf-${index}`}
              style={[
                styles.leaf,
                {
                  transform: [
                    {translateX: leaf.x},
                    {translateY: leaf.y},
                    {rotate},
                  ],
                },
              ]}>
              {index % 2 === 0 ? '🍃' : '🍂'}
            </Animated.Text>
          );
        })}

        {/* Fireflies */}
        {fireflyAnims.map((firefly, index) => (
          <Animated.Text
            key={`firefly-${index}`}
            style={[
              styles.firefly,
              {
                transform: [
                  {translateX: firefly.x},
                  {translateY: firefly.y},
                ],
                opacity: firefly.opacity,
              },
            ]}>
            ✨
          </Animated.Text>
        ))}

        {/* Dust particles */}
        {dustAnims.map((dust, index) => (
          <Animated.View
            key={`dust-${index}`}
            style={[
              styles.dustParticle,
              {
                transform: [
                  {translateX: dust.x},
                  {translateY: dust.y},
                ],
                opacity: dust.opacity,
              },
            ]}
          />
        ))}
      </>
    );
  };

  const renderSpeedLines = () => {
    if (!showSpeedLines) return null;

    return (
      <View style={styles.speedLinesContainer}>
        {Array(8).fill(0).map((_, i) => (
          <View
            key={i}
            style={[
              styles.speedLine,
              {
                top: 100 + i * 80,
                left: i % 2 === 0 ? 20 : undefined,
                right: i % 2 === 1 ? 20 : undefined,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderPlayer = () => {
    if (!engineRef.current) return null;
    const player = engineRef.current.getPlayer();
    const hasShield = engineRef.current.hasShield();

    const bounceY = playerBounce.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -8],
    });

    const rotation = playerRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    let emoji = '🏃‍♂️';
    if (player.isJumping) emoji = '🦸‍♂️';
    if (player.isSliding) emoji = '🏊‍♂️';

    return (
      <>
        {/* Player trail/afterimage */}
        <Animated.View
          style={[
            styles.playerTrail,
            {
              left: player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH - 5,
              bottom: height - player.position.y - 205,
              opacity: 0.3,
            },
          ]}>
          <Text style={styles.playerEmojiSmall}>{emoji}</Text>
        </Animated.View>

        {/* Main player */}
        <Animated.View
          style={[
            styles.player,
            {
              left: player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
              bottom: height - player.position.y - 200,
              transform: [
                {translateY: bounceY},
                {scale: playerScale},
                {rotate: rotation},
              ],
            },
            hasShield ? styles.shielded : null,
          ]}>
          <Text style={styles.playerEmoji}>{emoji}</Text>
          {hasShield && <Text style={styles.shieldIcon}>🛡️</Text>}
        </Animated.View>
      </>
    );
  };

  const renderObstacles = () => {
    if (!engineRef.current) return null;
    const warningScale = warningPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.3],
    });

    return engineRef.current.getObstacles().map(obstacle => {
      const isClose = obstacle.position.y < 400;

      return (
        <View key={obstacle.id}>
          {/* Warning indicator for close obstacles */}
          {isClose && (
            <Animated.View
              style={[
                styles.warningIndicator,
                {
                  left: obstacle.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
                  bottom: height - obstacle.position.y - 150,
                  transform: [{scale: warningScale}],
                },
              ]}>
              <Text style={styles.warningText}>⚠️</Text>
            </Animated.View>
          )}

          <View
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
        </View>
      );
    });
  };

  const renderCoins = () => {
    if (!engineRef.current) return null;
    const glowScale = coinGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.3],
    });
    const rotation = coinRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
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
        <Animated.Text style={[styles.coinEmoji, {transform: [{rotateY: rotation}]}]}>
          💎
        </Animated.Text>
        {/* Sparkle effect */}
        <Animated.Text style={[styles.coinSparkle, {opacity: coinGlow}]}>✨</Animated.Text>
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
    <Animated.View
      style={[
        styles.container,
        {transform: [{translateX: screenShake}]}
      ]}
      {...panResponder.panHandlers}>

      {/* Sky gradient layers */}
      <View style={styles.skyTop} />
      <View style={styles.skyMiddle} />
      <View style={styles.skyBottom} />

      {/* Sun and rainbow */}
      {renderSunAndSky()}

      {/* Screen flash effect */}
      <Animated.View
        style={[
          styles.screenFlash,
          {opacity: screenFlash}
        ]}
        pointerEvents="none"
      />

      {/* Animated background elements */}
      {renderAnimatedBackground()}

      {/* Particles */}
      {renderParticles()}

      {/* Speed lines effect */}
      {renderSpeedLines()}

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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a2f14',
  },
  skyTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#4a90d9',
  },
  skyMiddle: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#87CEEB',
  },
  skyBottom: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#a8e6cf',
    opacity: 0.7,
  },
  sunContainer: {
    position: 'absolute',
    top: 10,
    right: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sun: {
    fontSize: 35,
  },
  sunRays: {
    position: 'absolute',
    fontSize: 70,
    color: '#FFD700',
    opacity: 0.3,
  },
  rainbow: {
    position: 'absolute',
    top: 30,
    left: 20,
  },
  rainbowText: {
    fontSize: 45,
  },
  screenFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFD700',
    zIndex: 100,
  },
  cloudLarge: {
    position: 'absolute',
    fontSize: 50,
  },
  cloudMedium: {
    position: 'absolute',
    fontSize: 35,
  },
  cloudSmall: {
    position: 'absolute',
    fontSize: 25,
  },
  flyingBird: {
    position: 'absolute',
    fontSize: 25,
  },
  flyingBirdLarge: {
    position: 'absolute',
    fontSize: 35,
  },
  leftJungleFar: {
    position: 'absolute',
    left: -5,
    top: 120,
    opacity: 0.5,
  },
  rightJungleFar: {
    position: 'absolute',
    right: -5,
    top: 120,
    opacity: 0.5,
  },
  treeFar: {
    fontSize: 30,
    marginBottom: 20,
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
    fontSize: 35,
  },
  jungleTreeLarge: {
    fontSize: 42,
  },
  jungleFern: {
    fontSize: 28,
  },
  jungleAnimal: {
    fontSize: 25,
  },
  jungleFlower: {
    fontSize: 22,
  },
  vine: {
    position: 'absolute',
    top: 160,
    fontSize: 20,
  },
  bottomVegetation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  vegetationDense: {
    fontSize: 18,
  },
  leaf: {
    position: 'absolute',
    fontSize: 18,
  },
  firefly: {
    position: 'absolute',
    fontSize: 12,
  },
  dustParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#d4a574',
    borderRadius: 3,
  },
  speedLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  speedLine: {
    position: 'absolute',
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
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
  playerTrail: {
    position: 'absolute',
    width: 50,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 45,
  },
  playerEmojiSmall: {
    fontSize: 35,
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
  warningIndicator: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
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
    fontSize: 50,
  },
  coin: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 30,
  },
  coinSparkle: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 12,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 25,
    paddingVertical: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  hudLabel: {
    color: '#FFD700',
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
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  multiplierText: {
    backgroundColor: '#FF4500',
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 15,
  },
  activePowerUps: {
    position: 'absolute',
    top: 105,
    left: 8,
    flexDirection: 'row',
  },
  activePowerUpItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 8,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  activePowerUpEmoji: {
    fontSize: 18,
  },
  pauseBtn: {
    position: 'absolute',
    top: 45,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 10,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  pauseBtnText: {
    fontSize: 20,
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
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  pauseSubtitle: {
    fontSize: 32,
    marginBottom: 40,
  },
  menuBtn: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 28,
    marginBottom: 15,
  },
  menuBtnText: {
    color: '#0a2f14',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quitBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  quitBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default GameScreen;
