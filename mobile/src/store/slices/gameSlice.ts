import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {GameState} from '../../types';

const initialState: GameState = {
  isPlaying: false,
  isPaused: false,
  score: 0,
  coins: 0,
  distance: 0,
  speed: 5,
  lives: 1,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame: state => {
      state.isPlaying = true;
      state.isPaused = false;
      state.score = 0;
      state.coins = 0;
      state.distance = 0;
      state.speed = 5;
      state.lives = 1;
    },
    pauseGame: state => {
      state.isPaused = true;
    },
    resumeGame: state => {
      state.isPaused = false;
    },
    endGame: state => {
      state.isPlaying = false;
      state.isPaused = false;
    },
    updateScore: (state, action: PayloadAction<number>) => {
      state.score += action.payload;
    },
    collectCoin: (state, action: PayloadAction<number>) => {
      state.coins += action.payload;
      state.score += action.payload * 10;
    },
    updateDistance: (state, action: PayloadAction<number>) => {
      state.distance += action.payload;
      state.score += Math.floor(action.payload);
    },
    increaseSpeed: state => {
      state.speed = Math.min(state.speed + 0.5, 15);
    },
    loseLife: state => {
      state.lives -= 1;
      if (state.lives <= 0) {
        state.isPlaying = false;
      }
    },
    resetGame: state => {
      return initialState;
    },
  },
});

export const {
  startGame,
  pauseGame,
  resumeGame,
  endGame,
  updateScore,
  collectCoin,
  updateDistance,
  increaseSpeed,
  loseLife,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
