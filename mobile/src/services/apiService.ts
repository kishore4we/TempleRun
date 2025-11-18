import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.templerun.com/api/v1';

class ApiService {
  private client: AxiosInstance;
  private refreshing: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async config => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        // Handle 401 and refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshing) {
            return Promise.reject(error);
          }

          originalRequest._retry = true;
          this.refreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {refreshToken},
            );

            const {token: newToken} = response.data.data;
            await AsyncStorage.setItem('token', newToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            this.refreshing = false;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.refreshing = false;
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('refreshToken');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export default new ApiService();
