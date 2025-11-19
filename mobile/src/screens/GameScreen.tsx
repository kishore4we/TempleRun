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

// Enhanced particle counts
const NUM_STARS = 12;
const NUM_LEAVES = 10;
const NUM_FIREFLIES = 8;
const NUM_ENERGY_PARTICLES = 6;
const NUM_DUST_PARTICLES = 8;

// Milestone distances
const MILESTONES = [100, 250, 500, 750, 1000, 1500, 2000];

const GameScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const engineRef = useRef<GameEngine | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [, setRenderTrigger] = useState(0);
  const [powerUpMsg, setPowerUpMsg] = useState('');
  const [showSpeedLines, setShowSpeedLines] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [scorePopups, setScorePopups] = useState<Array<{id: number; value: number; x: number; y: number}>>([]);
  const [stamina, setStamina] = useState(100);
  const [achievements, setAchievements] = useState<Array<{id: number; text: string; icon: string}>>([]);
  const [nearMiss, setNearMiss] = useState(false);
  const [milestone, setMilestone] = useState<string | null>(null);
  const lastMilestoneRef = useRef(0);

  // Screen effects
  const screenShake = useRef(new Animated.Value(0)).current;
  const screenFlash = useRef(new Animated.Value(0)).current;
  const vignetteOpacity = useRef(new Animated.Value(0)).current;

  // Sky gradient animation
  const skyGradient = useRef(new Animated.Value(0)).current;

  // Sun animations - enhanced
  const sunGlow = useRef(new Animated.Value(0)).current;
  const sunRays = useRef(new Animated.Value(0)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;

  // Aurora/Northern lights effect
  const aurora1 = useRef(new Animated.Value(0)).current;
  const aurora2 = useRef(new Animated.Value(0)).current;

  // Bird animations with better patterns
  const bird1Anim = useRef(new Animated.Value(0)).current;
  const bird1Y = useRef(new Animated.Value(0)).current;
  const bird1Wing = useRef(new Animated.Value(0)).current;
  const bird2Anim = useRef(new Animated.Value(0)).current;
  const bird2Y = useRef(new Animated.Value(0)).current;
  const bird3Anim = useRef(new Animated.Value(0)).current;

  // Cloud animations - parallax layers
  const cloud1Anim = useRef(new Animated.Value(0)).current;
  const cloud2Anim = useRef(new Animated.Value(0)).current;
  const cloud3Anim = useRef(new Animated.Value(0)).current;

  // Tree animations - natural sway
  const tree1Anim = useRef(new Animated.Value(0)).current;
  const tree2Anim = useRef(new Animated.Value(0)).current;
  const tree3Anim = useRef(new Animated.Value(0)).current;
  const tree4Anim = useRef(new Animated.Value(0)).current;

  // Player animations - enhanced
  const playerBounce = useRef(new Animated.Value(0)).current;
  const playerScale = useRef(new Animated.Value(1)).current;
  const playerRotation = useRef(new Animated.Value(0)).current;
  const playerGlow = useRef(new Animated.Value(0)).current;
  const playerShadow = useRef(new Animated.Value(1)).current;

  // Coin animations - enhanced
  const coinGlow = useRef(new Animated.Value(0)).current;
  const coinRotate = useRef(new Animated.Value(0)).current;
  const coinFloat = useRef(new Animated.Value(0)).current;

  // Star particles
  const starAnims = useRef(
    Array(NUM_STARS).fill(0).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height * 0.3),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
    }))
  ).current;

  // Leaf particles
  const leafAnims = useRef(
    Array(NUM_LEAVES).fill(0).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0.8 + Math.random() * 0.4),
    }))
  ).current;

  // Firefly particles
  const fireflyAnims = useRef(
    Array(NUM_FIREFLIES).fill(0).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
    }))
  ).current;

  // Energy particles for power-ups
  const energyAnims = useRef(
    Array(NUM_ENERGY_PARTICLES).fill(0).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Combo animation
  const comboScale = useRef(new Animated.Value(1)).current;
  const comboOpacity = useRef(new Animated.Value(0)).current;

  // Score popup animations
  const scorePopupAnims = useRef<Array<{y: Animated.Value; opacity: Animated.Value}>>([]).current;

  // Warning pulse
  const warningPulse = useRef(new Animated.Value(0)).current;

  // HUD animations
  const hudSlide = useRef(new Animated.Value(-100)).current;
  const hudOpacity = useRef(new Animated.Value(0)).current;

  // Stamina bar animation
  const staminaWidth = useRef(new Animated.Value(100)).current;
  const staminaPulse = useRef(new Animated.Value(1)).current;

  // Achievement popup animation
  const achievementSlide = useRef(new Animated.Value(-200)).current;
  const achievementOpacity = useRef(new Animated.Value(0)).current;

  // Near miss effect
  const nearMissScale = useRef(new Animated.Value(1)).current;
  const nearMissOpacity = useRef(new Animated.Value(0)).current;

  // Milestone celebration
  const milestoneScale = useRef(new Animated.Value(0)).current;
  const milestoneOpacity = useRef(new Animated.Value(0)).current;
  const milestoneRotate = useRef(new Animated.Value(0)).current;

  // Landing dust particles
  const dustParticles = useRef(
    Array(NUM_DUST_PARTICLES).fill(0).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  ).current;

  // Score shake
  const scoreShake = useRef(new Animated.Value(0)).current;
  const coinsShake = useRef(new Animated.Value(0)).current;

  // Hitstop effect
  const hitstopRef = useRef(false);

  const isPausedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isGameOverRef = useRef(false);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popupIdRef = useRef(0);

  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  // Start all animations
  useEffect(() => {
    startAllAnimations();
    animateHUDEntry();
  }, []);

  const animateHUDEntry = () => {
    Animated.parallel([
      Animated.spring(hudSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(hudOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startAllAnimations = () => {
    // Sky gradient cycling
    Animated.loop(
      Animated.sequence([
        Animated.timing(skyGradient, {
          toValue: 1,
          duration: 30000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(skyGradient, {
          toValue: 0,
          duration: 30000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Sun glow pulsing - enhanced
    Animated.loop(
      Animated.parallel([
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
        ]),
        Animated.sequence([
          Animated.timing(sunPulse, {
            toValue: 1.1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sunPulse, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Sun rays rotating
    Animated.loop(
      Animated.timing(sunRays, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Aurora effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(aurora1, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(aurora1, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(aurora2, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(aurora2, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bird animations with wing flapping
    Animated.loop(
      Animated.timing(bird1Anim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bird1Y, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bird1Y, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wing flapping
    Animated.loop(
      Animated.sequence([
        Animated.timing(bird1Wing, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bird1Wing, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(bird2Anim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bird2Y, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bird2Y, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(bird3Anim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Clouds - different speeds for parallax
    Animated.loop(
      Animated.timing(cloud1Anim, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(cloud2Anim, {
        toValue: 1,
        duration: 35000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(cloud3Anim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Tree swaying - natural wind effect
    const createTreeSway = (anim: Animated.Value, duration: number, amplitude: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: amplitude,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: -amplitude,
            duration: duration * 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createTreeSway(tree1Anim, 1500, 1);
    createTreeSway(tree2Anim, 2000, 1);
    createTreeSway(tree3Anim, 1800, 1);
    createTreeSway(tree4Anim, 2200, 1);

    // Player bounce - smoother
    Animated.loop(
      Animated.sequence([
        Animated.timing(playerBounce, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(playerBounce, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Player glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(playerGlow, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(playerGlow, {
          toValue: 0.5,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Coin animations - enhanced
    Animated.loop(
      Animated.timing(coinRotate, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(coinGlow, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coinGlow, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(coinFloat, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coinFloat, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Star twinkling
    starAnims.forEach((star, index) => {
      const twinkle = () => {
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: 0.8 + Math.random() * 0.2,
            duration: 500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: 0.2,
            duration: 500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]).start(() => twinkle());
      };
      setTimeout(twinkle, index * 200);
    });

    // Falling leaves
    leafAnims.forEach((leaf, index) => {
      const startLeafAnimation = () => {
        leaf.x.setValue(Math.random() * width);
        leaf.y.setValue(-50);
        leaf.rotate.setValue(0);

        Animated.parallel([
          Animated.timing(leaf.y, {
            toValue: height + 50,
            duration: 5000 + Math.random() * 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(leaf.x, {
            toValue: leaf.x._value + (Math.random() - 0.5) * 150,
            duration: 5000 + Math.random() * 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(leaf.rotate, {
            toValue: Math.random() > 0.5 ? 8 : -8,
            duration: 5000 + Math.random() * 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(startLeafAnimation, index * 300);
        });
      };

      setTimeout(startLeafAnimation, index * 600);
    });

    // Fireflies
    fireflyAnims.forEach((firefly, index) => {
      const animateFirefly = () => {
        firefly.x.setValue(40 + Math.random() * (width - 80));
        firefly.y.setValue(150 + Math.random() * (height - 350));

        Animated.sequence([
          Animated.timing(firefly.opacity, {
            toValue: 0.9,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(500 + Math.random() * 1000),
          Animated.timing(firefly.opacity, {
            toValue: 0,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(animateFirefly, Math.random() * 1500);
        });
      };

      setTimeout(animateFirefly, index * 400);
    });

    // Warning pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(warningPulse, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(warningPulse, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const triggerScreenShake = () => {
    Animated.sequence([
      Animated.timing(screenShake, {toValue: 12, duration: 40, useNativeDriver: true}),
      Animated.timing(screenShake, {toValue: -12, duration: 40, useNativeDriver: true}),
      Animated.timing(screenShake, {toValue: 10, duration: 40, useNativeDriver: true}),
      Animated.timing(screenShake, {toValue: -10, duration: 40, useNativeDriver: true}),
      Animated.timing(screenShake, {toValue: 6, duration: 40, useNativeDriver: true}),
      Animated.timing(screenShake, {toValue: 0, duration: 40, useNativeDriver: true}),
    ]).start();

    // Vignette effect on hit
    Animated.sequence([
      Animated.timing(vignetteOpacity, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(vignetteOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerScreenFlash = () => {
    Animated.sequence([
      Animated.timing(screenFlash, {
        toValue: 0.8,
        duration: 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(screenFlash, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerComboAnimation = (count: number) => {
    comboOpacity.setValue(1);
    comboScale.setValue(0.5);

    Animated.parallel([
      Animated.spring(comboScale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(comboOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const addScorePopup = (value: number, x: number, y: number) => {
    const id = popupIdRef.current++;
    setScorePopups(prev => [...prev, {id, value, x, y}]);

    setTimeout(() => {
      setScorePopups(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  const triggerJumpAnimation = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(playerScale, {
          toValue: 0.85,
          duration: 80,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(playerScale, {
          toValue: 1.15,
          tension: 150,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(playerScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(playerRotation, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      playerRotation.setValue(0);
    });

    // Shadow shrinks when jumping
    Animated.sequence([
      Animated.timing(playerShadow, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(playerShadow, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerSlideAnimation = () => {
    Animated.sequence([
      Animated.timing(playerScale, {
        toValue: 1.2,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(playerScale, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerEnergyBurst = () => {
    energyAnims.forEach((energy, index) => {
      const angle = (index / NUM_ENERGY_PARTICLES) * Math.PI * 2;
      energy.x.setValue(width / 2);
      energy.y.setValue(height - 200);
      energy.opacity.setValue(1);

      Animated.parallel([
        Animated.timing(energy.x, {
          toValue: width / 2 + Math.cos(angle) * 100,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(energy.y, {
          toValue: height - 200 + Math.sin(angle) * 100,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(energy.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Hitstop - brief pause for impact
  const triggerHitstop = (duration: number = 50) => {
    hitstopRef.current = true;
    setTimeout(() => hitstopRef.current = false, duration);
  };

  // Score shake animation
  const triggerScoreShake = () => {
    Animated.sequence([
      Animated.timing(scoreShake, {toValue: 5, duration: 30, useNativeDriver: true}),
      Animated.timing(scoreShake, {toValue: -5, duration: 30, useNativeDriver: true}),
      Animated.timing(scoreShake, {toValue: 3, duration: 30, useNativeDriver: true}),
      Animated.timing(scoreShake, {toValue: 0, duration: 30, useNativeDriver: true}),
    ]).start();
  };

  const triggerCoinsShake = () => {
    Animated.sequence([
      Animated.timing(coinsShake, {toValue: 5, duration: 30, useNativeDriver: true}),
      Animated.timing(coinsShake, {toValue: -5, duration: 30, useNativeDriver: true}),
      Animated.timing(coinsShake, {toValue: 3, duration: 30, useNativeDriver: true}),
      Animated.timing(coinsShake, {toValue: 0, duration: 30, useNativeDriver: true}),
    ]).start();
  };

  // Near miss effect
  const triggerNearMiss = () => {
    setNearMiss(true);
    nearMissOpacity.setValue(1);
    nearMissScale.setValue(0.8);

    Animated.parallel([
      Animated.spring(nearMissScale, {
        toValue: 1.2,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(nearMissOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setNearMiss(false));
  };

  // Achievement popup
  const showAchievement = (text: string, icon: string) => {
    const id = Date.now();
    setAchievements(prev => [...prev, {id, text, icon}]);

    achievementOpacity.setValue(1);
    achievementSlide.setValue(-200);

    Animated.sequence([
      Animated.spring(achievementSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(achievementSlide, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAchievements(prev => prev.filter(a => a.id !== id));
    });
  };

  // Milestone celebration
  const triggerMilestoneCelebration = (distance: number) => {
    setMilestone(`${distance}m`);
    milestoneScale.setValue(0);
    milestoneOpacity.setValue(1);
    milestoneRotate.setValue(0);

    Animated.parallel([
      Animated.spring(milestoneScale, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(milestoneRotate, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(milestoneOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setMilestone(null));

    // Show achievement for milestone
    const badges: Record<number, {text: string; icon: string}> = {
      100: {text: 'First Steps!', icon: '🥉'},
      250: {text: 'Getting Warmed Up!', icon: '🏃'},
      500: {text: 'Half Way There!', icon: '🥈'},
      750: {text: 'Marathon Runner!', icon: '🏅'},
      1000: {text: 'Jungle Master!', icon: '🥇'},
      1500: {text: 'Legendary!', icon: '👑'},
      2000: {text: 'Unstoppable!', icon: '🔥'},
    };

    if (badges[distance]) {
      setTimeout(() => {
        showAchievement(badges[distance].text, badges[distance].icon);
      }, 500);
    }
  };

  // Landing dust effect
  const triggerLandingDust = (playerX: number) => {
    dustParticles.forEach((dust, index) => {
      const offsetX = (index - NUM_DUST_PARTICLES / 2) * 8;
      dust.x.setValue(playerX + width / 2 - GAME_CONFIG.LANE_WIDTH + offsetX);
      dust.y.setValue(height - 220);
      dust.opacity.setValue(0.8);
      dust.scale.setValue(0.5);

      Animated.parallel([
        Animated.timing(dust.y, {
          toValue: height - 250 - Math.random() * 30,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dust.x, {
          toValue: dust.x._value + (Math.random() - 0.5) * 40,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dust.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dust.scale, {
          toValue: 1.5,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Update stamina bar
  const updateStamina = (value: number) => {
    setStamina(value);
    Animated.timing(staminaWidth, {
      toValue: value,
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Pulse when low
    if (value < 30) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(staminaPulse, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(staminaPulse, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        {iterations: 3}
      ).start();
    }
  };

  useEffect(() => {
    isPausedRef.current = gameState.isPaused;
    isPlayingRef.current = gameState.isPlaying;
  }, [gameState.isPaused, gameState.isPlaying]);

  useEffect(() => {
    initGame();
    return () => {
      stopGameLoop();
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }
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
      if (isPausedRef.current || !isPlayingRef.current || isGameOverRef.current || hitstopRef.current) {
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
          triggerHitstop(30); // Brief pause for impact
          triggerCoinsShake();

          // Combo system
          setComboCount(prev => {
            const newCount = prev + 1;
            if (newCount > 1) {
              triggerComboAnimation(newCount);
            }
            return newCount;
          });

          // Reset combo timer
          if (comboTimeoutRef.current) {
            clearTimeout(comboTimeoutRef.current);
          }
          comboTimeoutRef.current = setTimeout(() => {
            setComboCount(0);
          }, 2000);

          // Score popup
          const player = engineRef.current.getPlayer();
          addScorePopup(
            result.coinsCollected * 10,
            player.position.x + width / 2,
            height - player.position.y - 250
          );
        }

        if (result.distanceTraveled > 0) {
          dispatch(updateDistance(result.distanceTraveled));
          triggerScoreShake();

          // Check for milestones
          const currentDistance = Math.floor(gameState.distance + result.distanceTraveled);
          for (const m of MILESTONES) {
            if (currentDistance >= m && lastMilestoneRef.current < m) {
              lastMilestoneRef.current = m;
              triggerMilestoneCelebration(m);
              break;
            }
          }

          // Update stamina (slowly regenerates, depletes on actions)
          setStamina(prev => Math.min(100, prev + 0.1));
        }

        if (result.powerUpCollected) {
          showPowerUp(result.powerUpCollected);
          triggerScreenFlash();
          triggerEnergyBurst();
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
      shield: '🛡️ SHIELD ACTIVE!',
      multiplier: '✨ 2X COINS!',
      boost: '⚡ SPEED BOOST!',
    };
    setPowerUpMsg(msgs[type] || '');
    setTimeout(() => setPowerUpMsg(''), 2000);
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
      '🌴 JUNGLE RUN OVER 🌴',
      `🏆 Score: ${gameState.score}\n💎 Gems: ${gameState.coins}\n📏 Distance: ${Math.floor(gameState.distance)}m\n🔥 Best Combo: ${comboCount}x`,
      [
        {text: 'Home', onPress: () => navigation.goBack()},
        {
          text: 'Play Again',
          onPress: () => {
            setComboCount(0);
            lastMilestoneRef.current = 0;
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
          } else if (dx < -30) {
            engineRef.current?.handleSwipe(Direction.LEFT);
          }
        } else {
          if (dy < -30) {
            engineRef.current?.handleSwipe(Direction.UP);
            triggerJumpAnimation();
            // Deplete stamina on jump
            setStamina(prev => Math.max(0, prev - 5));
            // Trigger landing dust after jump
            setTimeout(() => {
              if (engineRef.current) {
                triggerLandingDust(engineRef.current.getPlayer().position.x);
              }
            }, 400);
          } else if (dy > 30) {
            engineRef.current?.handleSwipe(Direction.DOWN);
            triggerSlideAnimation();
            // Deplete stamina on slide
            setStamina(prev => Math.max(0, prev - 3));
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

  const renderSkyAndAtmosphere = () => {
    const raysRotation = sunRays.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const auroraX1 = aurora1.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, 50],
    });

    const auroraX2 = aurora2.interpolate({
      inputRange: [0, 1],
      outputRange: [50, -50],
    });

    return (
      <>
        {/* Gradient sky layers */}
        <View style={styles.skyLayer1} />
        <View style={styles.skyLayer2} />
        <View style={styles.skyLayer3} />

        {/* Aurora effect */}
        <Animated.View
          style={[
            styles.aurora,
            {
              transform: [{translateX: auroraX1}],
              opacity: aurora1.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.1, 0.3, 0.1],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.aurora2,
            {
              transform: [{translateX: auroraX2}],
              opacity: aurora2.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.1, 0.25, 0.1],
              }),
            },
          ]}
        />

        {/* Sun with enhanced glow */}
        <Animated.View style={[styles.sunContainer, {transform: [{scale: sunPulse}]}]}>
          <Animated.View style={[styles.sunOuterGlow, {opacity: sunGlow}]} />
          <Animated.Text style={[styles.sunRays, {transform: [{rotate: raysRotation}]}]}>
            ✺
          </Animated.Text>
          <Text style={styles.sun}>☀️</Text>
        </Animated.View>

        {/* Stars */}
        {starAnims.map((star, index) => (
          <Animated.Text
            key={`star-${index}`}
            style={[
              styles.star,
              {
                left: star.x,
                top: star.y,
                opacity: star.opacity,
                transform: [{scale: star.scale}],
              },
            ]}>
            ⭐
          </Animated.Text>
        ))}
      </>
    );
  };

  const renderAnimatedBackground = () => {
    const bird1X = bird1Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, width + 50],
    });
    const bird1YMove = bird1Y.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -25],
    });

    const bird2X = bird2Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [width + 50, -50],
    });
    const bird2YMove = bird2Y.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 30],
    });

    const bird3X = bird3Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-30, width + 30],
    });

    const cloud1X = cloud1Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-120, width + 120],
    });
    const cloud2X = cloud2Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [width + 100, -100],
    });
    const cloud3X = cloud3Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, width + 80],
    });

    const tree1Rotate = tree1Anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-6deg', '0deg', '6deg'],
    });
    const tree2Rotate = tree2Anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['5deg', '0deg', '-5deg'],
    });
    const tree3Rotate = tree3Anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-5deg', '0deg', '5deg'],
    });
    const tree4Rotate = tree4Anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['4deg', '0deg', '-4deg'],
    });

    return (
      <>
        {/* Clouds with depth */}
        <Animated.Text style={[styles.cloudFar, {transform: [{translateX: cloud2X}], top: 35}]}>
          ☁️
        </Animated.Text>
        <Animated.Text style={[styles.cloudLarge, {transform: [{translateX: cloud1X}], top: 15}]}>
          ☁️
        </Animated.Text>
        <Animated.Text style={[styles.cloudMedium, {transform: [{translateX: cloud3X}], top: 65}]}>
          ☁️
        </Animated.Text>

        {/* Flying birds */}
        <Animated.Text
          style={[
            styles.flyingBird,
            {transform: [{translateX: bird1X}, {translateY: bird1YMove}], top: 85},
          ]}>
          🦜
        </Animated.Text>
        <Animated.Text
          style={[
            styles.flyingBirdLarge,
            {transform: [{translateX: bird2X}, {translateY: bird2YMove}], top: 105},
          ]}>
          🦅
        </Animated.Text>
        <Animated.Text style={[styles.flyingBird, {transform: [{translateX: bird3X}], top: 60}]}>
          🦋
        </Animated.Text>

        {/* Jungle depth layers */}
        <View style={styles.jungleLayerFar}>
          <Text style={styles.treeFar}>🌲</Text>
          <Text style={styles.treeFar}>🌲</Text>
          <Text style={styles.treeFar}>🌲</Text>
        </View>

        <View style={styles.jungleLayerFarRight}>
          <Text style={styles.treeFar}>🌲</Text>
          <Text style={styles.treeFar}>🌲</Text>
        </View>

        {/* Left jungle */}
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

        {/* Right jungle */}
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
        <Text style={[styles.vine, {right: 35, top: 180}]}>🍃</Text>

        {/* Bottom vegetation */}
        <View style={styles.bottomVegetation}>
          <Text style={styles.vegetationDense}>🌿🌱🍀🌿🌱🍀🌿🌱🍀🌿</Text>
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
            inputRange: [-8, 0, 8],
            outputRange: ['-360deg', '0deg', '360deg'],
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
                    {scale: leaf.scale},
                  ],
                },
              ]}>
              {index % 3 === 0 ? '🍃' : index % 3 === 1 ? '🍂' : '🌿'}
            </Animated.Text>
          );
        })}

        {/* Fireflies */}
        {fireflyAnims.map((firefly, index) => (
          <Animated.View
            key={`firefly-${index}`}
            style={[
              styles.fireflyContainer,
              {
                transform: [{translateX: firefly.x}, {translateY: firefly.y}, {scale: firefly.scale}],
                opacity: firefly.opacity,
              },
            ]}>
            <Text style={styles.firefly}>✨</Text>
          </Animated.View>
        ))}

        {/* Energy particles */}
        {energyAnims.map((energy, index) => (
          <Animated.View
            key={`energy-${index}`}
            style={[
              styles.energyParticle,
              {
                transform: [{translateX: energy.x}, {translateY: energy.y}],
                opacity: energy.opacity,
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
      <View style={styles.speedLinesContainer} pointerEvents="none">
        {Array(10).fill(0).map((_, i) => (
          <View
            key={i}
            style={[
              styles.speedLine,
              {
                top: 80 + i * 70,
                left: i % 2 === 0 ? 15 : undefined,
                right: i % 2 === 1 ? 15 : undefined,
                width: 30 + Math.random() * 20,
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
      outputRange: [0, -10],
    });

    const rotation = playerRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    let emoji = '🏃';
    if (player.isJumping) emoji = '🦸';
    if (player.isSliding) emoji = '🏊';

    return (
      <>
        {/* Player shadow */}
        <Animated.View
          style={[
            styles.playerShadow,
            {
              left: player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH + 5,
              bottom: height - player.position.y - 215,
              transform: [{scaleX: playerShadow}, {scaleY: 0.3}],
            },
          ]}
        />

        {/* Player trail */}
        <View
          style={[
            styles.playerTrail,
            {
              left: player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH - 8,
              bottom: height - player.position.y - 205,
            },
          ]}>
          <Text style={styles.playerEmojiTrail}>{emoji}</Text>
        </View>

        {/* Main player */}
        <Animated.View
          style={[
            styles.player,
            {
              left: player.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
              bottom: height - player.position.y - 200,
              transform: [{translateY: bounceY}, {scale: playerScale}, {rotate: rotation}],
            },
            hasShield && styles.shielded,
          ]}>
          {/* Glow effect */}
          <Animated.View style={[styles.playerGlow, {opacity: playerGlow}]} />
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
      outputRange: [1, 1.4],
    });

    return engineRef.current.getObstacles().map(obstacle => {
      const isClose = obstacle.position.y < 350;

      return (
        <View key={obstacle.id}>
          {isClose && (
            <Animated.View
              style={[
                styles.warningIndicator,
                {
                  left: obstacle.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH + 10,
                  bottom: height - obstacle.position.y - 140,
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
            <Text style={styles.obstacleEmoji}>{getObstacleEmoji(obstacle.obstacleType)}</Text>
          </View>
        </View>
      );
    });
  };

  const renderCoins = () => {
    if (!engineRef.current) return null;
    const glowScale = coinGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.4],
    });
    const floatY = coinFloat.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -8],
    });

    return engineRef.current.getCoins().map(coin => (
      <Animated.View
        key={coin.id}
        style={[
          styles.coin,
          {
            left: coin.position.x + width / 2 - GAME_CONFIG.LANE_WIDTH,
            bottom: height - coin.position.y - 200,
            transform: [{scale: glowScale}, {translateY: floatY}],
          },
        ]}>
        <View style={styles.coinGlow} />
        <Text style={styles.coinEmoji}>💎</Text>
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
        <View style={styles.powerUpGlow} />
        <Text style={styles.powerUpEmoji}>{getPowerUpEmoji(powerup.powerType)}</Text>
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

  const renderCombo = () => {
    if (comboCount < 2) return null;

    return (
      <Animated.View
        style={[
          styles.comboContainer,
          {
            transform: [{scale: comboScale}],
            opacity: comboOpacity,
          },
        ]}>
        <Text style={styles.comboText}>🔥 {comboCount}x COMBO 🔥</Text>
      </Animated.View>
    );
  };

  const renderScorePopups = () => {
    return scorePopups.map(popup => (
      <View
        key={popup.id}
        style={[
          styles.scorePopup,
          {left: popup.x - 20, bottom: popup.y},
        ]}>
        <Text style={styles.scorePopupText}>+{popup.value}</Text>
      </View>
    ));
  };

  const renderStaminaBar = () => {
    const staminaColor = stamina > 50 ? '#00ff88' : stamina > 25 ? '#ffaa00' : '#ff4444';

    return (
      <Animated.View style={[styles.staminaContainer, {transform: [{scale: staminaPulse}]}]}>
        <View style={styles.staminaBarBg}>
          <Animated.View
            style={[
              styles.staminaBarFill,
              {
                width: staminaWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: staminaColor,
              },
            ]}
          />
        </View>
        <Text style={styles.staminaLabel}>⚡ ENERGY</Text>
      </Animated.View>
    );
  };

  const renderAchievements = () => {
    if (achievements.length === 0) return null;

    return achievements.map(achievement => (
      <Animated.View
        key={achievement.id}
        style={[
          styles.achievementPopup,
          {
            transform: [{translateX: achievementSlide}],
            opacity: achievementOpacity,
          },
        ]}>
        <Text style={styles.achievementIcon}>{achievement.icon}</Text>
        <View style={styles.achievementTextContainer}>
          <Text style={styles.achievementTitle}>ACHIEVEMENT!</Text>
          <Text style={styles.achievementText}>{achievement.text}</Text>
        </View>
      </Animated.View>
    ));
  };

  const renderMilestone = () => {
    if (!milestone) return null;

    const rotation = milestoneRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['-10deg', '0deg'],
    });

    return (
      <Animated.View
        style={[
          styles.milestoneContainer,
          {
            transform: [{scale: milestoneScale}, {rotate: rotation}],
            opacity: milestoneOpacity,
          },
        ]}>
        <Text style={styles.milestoneIcon}>🎉</Text>
        <Text style={styles.milestoneText}>{milestone}</Text>
        <Text style={styles.milestoneIcon}>🎉</Text>
      </Animated.View>
    );
  };

  const renderNearMiss = () => {
    if (!nearMiss) return null;

    return (
      <Animated.View
        style={[
          styles.nearMissContainer,
          {
            transform: [{scale: nearMissScale}],
            opacity: nearMissOpacity,
          },
        ]}>
        <Text style={styles.nearMissText}>CLOSE CALL!</Text>
      </Animated.View>
    );
  };

  const renderDustParticles = () => {
    return dustParticles.map((dust, index) => (
      <Animated.View
        key={`dust-${index}`}
        style={[
          styles.dustParticle,
          {
            transform: [
              {translateX: dust.x},
              {translateY: dust.y},
              {scale: dust.scale},
            ],
            opacity: dust.opacity,
          },
        ]}
      />
    ));
  };

  return (
    <Animated.View
      style={[styles.container, {transform: [{translateX: screenShake}]}]}
      {...panResponder.panHandlers}>

      {/* Sky and atmosphere */}
      {renderSkyAndAtmosphere()}

      {/* Screen flash */}
      <Animated.View style={[styles.screenFlash, {opacity: screenFlash}]} pointerEvents="none" />

      {/* Vignette effect */}
      <Animated.View style={[styles.vignette, {opacity: vignetteOpacity}]} pointerEvents="none" />

      {/* Animated background */}
      {renderAnimatedBackground()}

      {/* Particles */}
      {renderParticles()}

      {/* Dust particles */}
      {renderDustParticles()}

      {/* Speed lines */}
      {renderSpeedLines()}

      {/* Road */}
      <View style={styles.road}>
        <View style={styles.roadGlow} />
        <View style={styles.lane} />
        <View style={styles.lane} />
        <View style={styles.lane} />
      </View>

      {/* Game objects */}
      {renderPlayer()}
      {renderObstacles()}
      {renderCoins()}
      {renderPowerUps()}

      {/* Score popups */}
      {renderScorePopups()}

      {/* Combo display */}
      {renderCombo()}

      {/* Power-up message */}
      {powerUpMsg !== '' && (
        <View style={styles.powerUpMsgBox}>
          <Text style={styles.powerUpMsgText}>{powerUpMsg}</Text>
        </View>
      )}

      {/* HUD with glassmorphism */}
      <Animated.View
        style={[
          styles.hud,
          {
            transform: [{translateY: hudSlide}],
            opacity: hudOpacity,
          },
        ]}>
        <Animated.View style={[styles.hudItem, {transform: [{translateX: scoreShake}]}]}>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudValue}>{gameState.score}</Text>
        </Animated.View>
        <Animated.View style={[styles.hudItem, {transform: [{translateX: coinsShake}]}]}>
          <Text style={styles.hudLabel}>GEMS</Text>
          <Text style={styles.hudValue}>{gameState.coins}</Text>
        </Animated.View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>DISTANCE</Text>
          <Text style={styles.hudValue}>{Math.floor(gameState.distance)}m</Text>
        </View>
      </Animated.View>

      {/* Stamina bar */}
      {renderStaminaBar()}

      {/* Achievements */}
      {renderAchievements()}

      {/* Milestone celebration */}
      {renderMilestone()}

      {/* Near miss alert */}
      {renderNearMiss()}

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
        <Text style={styles.pauseBtnText}>{gameState.isPaused ? '▶️' : '⏸️'}</Text>
      </TouchableOpacity>

      {/* Pause overlay */}
      {gameState.isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>PAUSED</Text>
            <Text style={styles.pauseStats}>
              Score: {gameState.score} | Gems: {gameState.coins}
            </Text>
            <TouchableOpacity style={styles.resumeBtn} onPress={handlePause}>
              <Text style={styles.resumeBtnText}>RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.quitBtnText}>QUIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d3320',
  },
  skyLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#1a5f7a',
  },
  skyLayer2: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#57c5b6',
  },
  skyLayer3: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#159895',
    opacity: 0.6,
  },
  aurora: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#00ff88',
  },
  aurora2: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#00ffff',
  },
  sunContainer: {
    position: 'absolute',
    top: 8,
    right: 25,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunOuterGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFD700',
  },
  sun: {
    fontSize: 40,
  },
  sunRays: {
    position: 'absolute',
    fontSize: 80,
    color: '#FFD700',
    opacity: 0.4,
  },
  star: {
    position: 'absolute',
    fontSize: 8,
  },
  screenFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00ff88',
    zIndex: 100,
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ff0000',
    zIndex: 99,
  },
  cloudFar: {
    position: 'absolute',
    fontSize: 30,
    opacity: 0.5,
  },
  cloudLarge: {
    position: 'absolute',
    fontSize: 55,
  },
  cloudMedium: {
    position: 'absolute',
    fontSize: 35,
  },
  flyingBird: {
    position: 'absolute',
    fontSize: 28,
  },
  flyingBirdLarge: {
    position: 'absolute',
    fontSize: 38,
  },
  jungleLayerFar: {
    position: 'absolute',
    left: -10,
    top: 110,
    opacity: 0.4,
  },
  jungleLayerFarRight: {
    position: 'absolute',
    right: -10,
    top: 110,
    opacity: 0.4,
  },
  treeFar: {
    fontSize: 28,
    marginBottom: 15,
  },
  leftJungle: {
    position: 'absolute',
    left: 0,
    top: 135,
    bottom: 35,
    justifyContent: 'space-around',
  },
  rightJungle: {
    position: 'absolute',
    right: 0,
    top: 135,
    bottom: 35,
    justifyContent: 'space-around',
  },
  jungleTree: {
    fontSize: 38,
  },
  jungleTreeLarge: {
    fontSize: 45,
  },
  jungleFern: {
    fontSize: 30,
  },
  jungleAnimal: {
    fontSize: 28,
  },
  jungleFlower: {
    fontSize: 24,
  },
  vine: {
    position: 'absolute',
    top: 155,
    fontSize: 22,
  },
  bottomVegetation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  vegetationDense: {
    fontSize: 16,
  },
  leaf: {
    position: 'absolute',
    fontSize: 16,
  },
  fireflyContainer: {
    position: 'absolute',
  },
  firefly: {
    fontSize: 14,
  },
  energyParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#00ff88',
    borderRadius: 4,
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
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 2,
  },
  road: {
    position: 'absolute',
    top: 95,
    bottom: 0,
    left: 48,
    right: 48,
    backgroundColor: '#3d2817',
    flexDirection: 'row',
    justifyContent: 'center',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderColor: '#2a1a0f',
  },
  roadGlow: {
    position: 'absolute',
    top: 0,
    left: -10,
    right: -10,
    height: 30,
    backgroundColor: '#00ff88',
    opacity: 0.1,
  },
  lane: {
    width: GAME_CONFIG.LANE_WIDTH,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#5a4030',
    borderStyle: 'dashed',
  },
  player: {
    position: 'absolute',
    width: 55,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00ff88',
  },
  playerShadow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playerTrail: {
    position: 'absolute',
    width: 55,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.25,
  },
  playerEmoji: {
    fontSize: 48,
  },
  playerEmojiTrail: {
    fontSize: 38,
  },
  shielded: {
    backgroundColor: 'rgba(0, 200, 255, 0.4)',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#00c8ff',
  },
  shieldIcon: {
    position: 'absolute',
    top: -10,
    fontSize: 22,
  },
  warningIndicator: {
    position: 'absolute',
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 22,
  },
  obstacle: {
    position: 'absolute',
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obstacleEmoji: {
    fontSize: 55,
  },
  coin: {
    position: 'absolute',
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinGlow: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
  },
  coinEmoji: {
    fontSize: 32,
  },
  coinSparkle: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontSize: 14,
  },
  powerUp: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerUpGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  powerUpEmoji: {
    fontSize: 32,
  },
  scorePopup: {
    position: 'absolute',
    zIndex: 200,
  },
  scorePopupText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    textShadowColor: '#000',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  comboContainer: {
    position: 'absolute',
    top: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 150,
  },
  comboText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  powerUpMsgBox: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 150,
  },
  powerUpMsgText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff88',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00ff88',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  hudLabel: {
    color: '#00ff88',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hudValue: {
    color: '#FFF',
    fontSize: 18,
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
    backgroundColor: '#FF6B00',
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 15,
  },
  activePowerUps: {
    position: 'absolute',
    top: 100,
    left: 10,
    flexDirection: 'row',
  },
  activePowerUpItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  activePowerUpEmoji: {
    fontSize: 20,
  },
  pauseBtn: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  pauseBtnText: {
    fontSize: 22,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseCard: {
    backgroundColor: 'rgba(13, 51, 32, 0.95)',
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00ff88',
    width: width * 0.8,
  },
  pauseTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 15,
    letterSpacing: 3,
  },
  pauseStats: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 25,
  },
  resumeBtn: {
    backgroundColor: '#00ff88',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  resumeBtnText: {
    color: '#0d3320',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  quitBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00ff88',
    width: '100%',
    alignItems: 'center',
  },
  quitBtnText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  staminaContainer: {
    position: 'absolute',
    top: 85,
    left: 10,
    right: 10,
  },
  staminaBarBg: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  staminaBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  staminaLabel: {
    color: '#00ff88',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  achievementPopup: {
    position: 'absolute',
    top: 130,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    zIndex: 200,
  },
  achievementIcon: {
    fontSize: 30,
    marginRight: 10,
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  achievementText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestoneContainer: {
    position: 'absolute',
    top: height / 2 - 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 300,
  },
  milestoneIcon: {
    fontSize: 40,
  },
  milestoneText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginHorizontal: 15,
    textShadowColor: '#000',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 5,
  },
  nearMissContainer: {
    position: 'absolute',
    top: height / 2 + 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 250,
  },
  nearMissText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  dustParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#d4a574',
    borderRadius: 4,
  },
});

export default GameScreen;
