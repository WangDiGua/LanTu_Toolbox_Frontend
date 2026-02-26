import { request } from '../request';
import { BackgroundTask } from '../../types';

export const dashboardApi = {
  getStats: () => request.get<any>('/dashboard/stats'),
  
  getResources: () => request.get<any>('/dashboard/resources'),
  
  getTasks: () => request.get<BackgroundTask[]>('/dashboard/tasks'),
  
  getNodes: () => request.get<any[]>('/dashboard/nodes'),
};