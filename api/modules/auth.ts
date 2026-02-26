import { request } from '../request';
import { User, MenuItem } from '../../types';

export interface LoginResponse {
  token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshResponse {
  token: string;
  refresh_token: string;
}

export interface MeResponse {
  user: User;
  menus: MenuItem[];
}

export const authApi = {
  getCaptcha: () => request.get<{ data: string; image: string }>('/auth/captcha'),
  
  login: (data: { username: string; password: string; captcha: string; captcha_data: string; rememberMe?: boolean }) => 
    request.post<LoginResponse>('/auth/login', data),
  
  refresh: (refresh_token: string) => 
    request.post<RefreshResponse>('/auth/refresh', { refresh_token }),
  
  getMe: () => request.get<MeResponse>('/auth/me'),
  
  updateProfile: (data: Partial<User>) => request.put<User>('/auth/profile', data),
  
  changePassword: (data: { old_password: string; new_password: string }) => 
    request.post('/auth/change-password', data)
};
