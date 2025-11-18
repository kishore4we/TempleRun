import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthState, User, ApiResponse} from '../../types';
import apiService from '../../services/apiService';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: {email: string; password: string}, {rejectWithValue}) => {
    try {
      const response = await apiService.post<ApiResponse<{user: User; token: string; refreshToken: string}>>(
        '/auth/login',
        credentials,
      );
      if (response.data.success && response.data.data) {
        await AsyncStorage.setItem('token', response.data.data.token);
        await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
        return response.data.data;
      }
      return rejectWithValue('Login failed');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    userData: {username: string; email: string; password: string},
    {rejectWithValue},
  ) => {
    try {
      const response = await apiService.post<ApiResponse<{user: User; token: string; refreshToken: string}>>(
        '/auth/register',
        userData,
      );
      if (response.data.success && response.data.data) {
        await AsyncStorage.setItem('token', response.data.data.token);
        await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
        return response.data.data;
      }
      return rejectWithValue('Registration failed');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('refreshToken');
});

export const loadStoredAuth = createAsyncThunk('auth/loadStored', async () => {
  const token = await AsyncStorage.getItem('token');
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (token) {
    const response = await apiService.get<ApiResponse<User>>('/auth/me');
    if (response.data.success && response.data.data) {
      return {user: response.data.data, token, refreshToken};
    }
  }
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearAuth: state => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(logout.fulfilled, state => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
        }
      });
  },
});

export const {setUser, clearAuth} = authSlice.actions;
export default authSlice.reducer;
