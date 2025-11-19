import {GameSession, ApiResponse} from '../types';
import apiService from './apiService';

class GameService {
  async startGameSession(): Promise<string> {
    try {
      const response = await apiService.post<ApiResponse<{sessionId: string}>>(
        '/game/start',
      );
      return response.data.data?.sessionId || '';
    } catch (error) {
      // Return empty session ID for offline play
      return '';
    }
  }

  async endGameSession(sessionData: {
    sessionId: string;
    score: number;
    coins: number;
    distance: number;
  }): Promise<void> {
    try {
      await apiService.post('/game/end', sessionData);
    } catch (error) {
      // Don't throw - allow offline play
    }
  }

  async getUserStats() {
    try {
      const response = await apiService.get<ApiResponse<any>>('/game/stats');
      return response.data.data;
    } catch (error) {
      return null;
    }
  }
}

export default new GameService();
