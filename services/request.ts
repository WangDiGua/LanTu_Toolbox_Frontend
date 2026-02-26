// In a real app, this would wrap Axios instance
// import axios from 'axios';

import { delay } from '../utils';

// Simulated Request Wrapper
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export const request = {
  get: async <T>(url: string, params?: any): Promise<ApiResponse<T>> => {
    console.log(`[GET] ${url}`, params);
    await delay(600); // Simulate network latency
    return { code: 200, data: {} as T, message: 'Success' }; // Mock return
  },
  
  post: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    console.log(`[POST] ${url}`, data);
    await delay(600);
    return { code: 200, data: {} as T, message: 'Success' };
  },

  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    console.log(`[DELETE] ${url}`);
    await delay(400);
    return { code: 200, data: {} as T, message: 'Deleted' };
  }
};