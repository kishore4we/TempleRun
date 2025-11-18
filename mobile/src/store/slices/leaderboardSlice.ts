import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {LeaderboardEntry, ApiResponse} from '../../types';
import apiService from '../../services/apiService';

interface LeaderboardState {
  global: LeaderboardEntry[];
  friends: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  global: [],
  friends: [],
  loading: false,
  error: null,
};

export const fetchGlobalLeaderboard = createAsyncThunk(
  'leaderboard/fetchGlobal',
  async (limit: number = 100) => {
    const response = await apiService.get<ApiResponse<LeaderboardEntry[]>>(
      `/leaderboard/global?limit=${limit}`,
    );
    return response.data.data || [];
  },
);

export const fetchFriendsLeaderboard = createAsyncThunk(
  'leaderboard/fetchFriends',
  async () => {
    const response = await apiService.get<ApiResponse<LeaderboardEntry[]>>(
      '/leaderboard/friends',
    );
    return response.data.data || [];
  },
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    clearLeaderboard: state => {
      state.global = [];
      state.friends = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchGlobalLeaderboard.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchGlobalLeaderboard.fulfilled,
        (state, action: PayloadAction<LeaderboardEntry[]>) => {
          state.loading = false;
          state.global = action.payload;
        },
      )
      .addCase(fetchGlobalLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch leaderboard';
      })
      .addCase(fetchFriendsLeaderboard.pending, state => {
        state.loading = true;
      })
      .addCase(
        fetchFriendsLeaderboard.fulfilled,
        (state, action: PayloadAction<LeaderboardEntry[]>) => {
          state.loading = false;
          state.friends = action.payload;
        },
      )
      .addCase(fetchFriendsLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch friends leaderboard';
      });
  },
});

export const {clearLeaderboard} = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
