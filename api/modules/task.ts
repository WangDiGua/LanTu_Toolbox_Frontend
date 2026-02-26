import { request } from '../request';

export interface TaskItem {
  id: number;
  vectorId?: number;
  name: string;
  type: 'build_index' | 'sync' | 'clean';
  status: 'In Progress' | 'Completed' | 'Failed';
  progress: number;
  startTime: string | null;
  endTime: string | null;
  errorMsg?: string;
  createdAt?: string;
}

export interface TaskListResponse {
  total: number;
  records: TaskItem[];
}

export const taskApi = {
  getList: (params?: { status?: string; page?: number; pageSize?: number }) => 
    request.get<TaskListResponse>('/tasks', params),
  
  getInProgress: () => 
    request.get<TaskItem[]>('/tasks/in-progress'),
  
  getById: (id: number) => 
    request.get<TaskItem>(`/tasks/${id}`),
  
  getStatus: (id: number) => 
    request.get<{ status: string; progress: number; message?: string }>(`/tasks/${id}/status`),
  
  cancel: (id: number) => 
    request.put(`/tasks/${id}/cancel`),
};
