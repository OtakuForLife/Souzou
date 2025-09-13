import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, ERROR_MESSAGES } from '@/config/constants';
import { log } from './logger';
import { getBackendURL } from '@/lib/settings';


/**
 * Enhanced API client with error handling, retries, and logging
 */
class ApiClient {
  private instance: AxiosInstance;
  private retryAttempts: number = API_CONFIG.RETRY_ATTEMPTS;

  constructor() {
    this.instance = axios.create({
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Ensure baseURL reflects current Settings on every request
        config.baseURL = getBackendURL();
        log.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        log.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        log.debug('API Response', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        log.error('API Response Error', error, {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });

        // Retry logic for network errors
        if (
          error.code === 'NETWORK_ERROR' &&
          originalRequest &&
          !originalRequest._retry &&
          this.retryAttempts > 0
        ) {
          originalRequest._retry = true;
          this.retryAttempts--;

          log.info('Retrying API request', {
            url: originalRequest.url,
            attemptsLeft: this.retryAttempts,
          });

          return this.instance(originalRequest);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.message;
      return new Error(`API Error (${error.response.status}): ${message}`);
    } else if (error.request) {
      // Network error
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      // Other error
      return new Error(error.message);
    }
  }

  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }
}

// Export singleton instance
const api = new ApiClient();
export default api;
