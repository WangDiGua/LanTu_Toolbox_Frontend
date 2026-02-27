import { request } from '../request';
import { SyncLog, SyncLogListResponse, SyncLogStats } from '../../types';

export const syncLogApi = {
  getList: (params?: {
    page?: number;
    pageSize?: number;
    type?: 'full' | 'incremental';
    status?: 'pending' | 'running' | 'success' | 'failed';
    method?: 'manual' | 'scheduled' | 'api';
    searchTerm?: string;
  }) => request.get<SyncLogListResponse>('/vector/sync-logs', params),
  getDetail: (id: number) => request.get<SyncLog>(`/vector/sync-logs/${id}`),
  getStats: () => request.get<SyncLogStats>('/vector/sync-logs/stats'),
  delete: (id: number) => request.delete(`/vector/sync-logs/${id}`),
};
