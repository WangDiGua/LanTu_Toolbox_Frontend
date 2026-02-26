import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '../config';

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

let authInvalidated = false;

export const isAuthInvalidated = () => authInvalidated;
export const resetAuthState = () => { authInvalidated = false; };

const service: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const getErrorKey = (error: string) => `${error}_${Date.now()}`;

const processQueue = (error: Error | null, token: string | null) => {
    failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    failedQueue = [];
};

const clearAuthAndRedirect = (message?: string) => {
    authInvalidated = true;
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.PERMISSIONS);
    localStorage.removeItem('menus');
    if (message) {
      sessionStorage.setItem('auth_error_message', message);
    }
    window.location.href = '#/login';
};

const PUBLIC_APIS = ['/auth/login', '/auth/captcha', '/auth/refresh'];

const isPublicApi = (url: string) => {
  return PUBLIC_APIS.some(api => url.includes(api));
};

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    
    if (res.code !== 200) {
      if (res.code === 401) {
        if (isPublicApi(response.config.url || '')) {
          return Promise.reject(new Error(res.message || '请求失败'));
        }
        
        const refreshToken = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
        const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
        
        if (!refreshToken || !token) {
          clearAuthAndRedirect();
          return Promise.reject(new Error(res.message || '登录已过期，请重新登录'));
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                response.config.headers['Authorization'] = `Bearer ${token}`;
                resolve(service.request(response.config));
              },
              reject: (err: Error) => {
                reject(err);
              }
            });
          });
        }

        isRefreshing = true;

        return axios.post(`${APP_CONFIG.API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        })
          .then((refreshRes) => {
            const data = refreshRes.data as ApiResponse<{ token: string; refresh_token: string }>;
            
            if (data.code === 200 && data.data) {
              const { token, refresh_token } = data.data;
              
              localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TOKEN, token);
              localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
              
              processQueue(null, token);
              
              response.config.headers['Authorization'] = `Bearer ${token}`;
              return service.request(response.config);
            } else {
              throw new Error(data.message || 'Token refresh failed');
            }
          })
          .catch((err) => {
            processQueue(err, null);
            clearAuthAndRedirect('登录已过期，请重新登录');
            return Promise.reject(new Error(err.response?.data?.message || err.message || '登录已过期，请重新登录'));
          })
          .finally(() => {
            isRefreshing = false;
          });
      }
      
      if (res.code === 403 || res.code === 404) {
        clearAuthAndRedirect(res.message || '访问被拒绝');
        return Promise.reject(new Error(res.message || '访问失败'));
      }
      
      return Promise.reject(new Error(res.message || '请求失败'));
    } else {
      return response;
    }
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '系统错误';
    const status = error.response?.status;
    
    if (status === 401 && !isPublicApi(error.config?.url || '')) {
      clearAuthAndRedirect('登录已过期，请重新登录');
    }
    
    if (status === 403 || status === 404) {
      clearAuthAndRedirect(msg || '访问被拒绝');
    }
    
    console.error('API Error:', msg);
    return Promise.reject(new Error(msg));
  }
);

const makeRequest = async <T>(config: any): Promise<ApiResponse<T>> => {
    const response = await service.request(config);
    return response.data as ApiResponse<T>;
};

export const request = {
  get: <T>(url: string, params?: any) => makeRequest<T>({ url, method: 'get', params }),
  post: <T>(url: string, data?: any) => makeRequest<T>({ url, method: 'post', data }),
  put: <T>(url: string, data?: any) => makeRequest<T>({ url, method: 'put', data }),
  delete: <T>(url: string, data?: any) => makeRequest<T>({ url, method: 'delete', data }),
  download: (url: string, params?: any) => makeRequest<any>({ url, method: 'get', params, responseType: 'blob' })
};
