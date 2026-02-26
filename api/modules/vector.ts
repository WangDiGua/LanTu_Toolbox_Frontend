import { request } from '../request';
import { VectorItem, DatabaseItem, TableItem, FieldItem } from '../../types';

export interface VectorListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: VectorItem[];
}

export interface PrimaryKeyInfo {
  columnName: string;
  dataType: string;
}

export interface VectorCreateParams {
  title: string;
  collectionName: string;
  dbId: string;
  tableIds: string[];
  fieldKeys: string[];
  primaryKeys: Record<string, string>;
  joinConfig?: {
    type: 'one_to_one' | 'one_to_many';
    conditions: {
      leftTable: string;
      leftField: string;
      rightTable: string;
      rightField: string;
    }[];
  } | null;
  advancedConfig: {
    indexType: 'HNSW' | 'IVF_FLAT' | 'FLAT';
    metric: 'COSINE' | 'L2' | 'IP';
    dimensions: number;
  };
}

export interface TaskCreateParams {
  name: string;
  vectorId: string;
  type: 'vectorization' | 'sync';
  config?: any;
}

export interface SearchParams {
  collectionId: string;
  query: string;
  type: 'dense' | 'hybrid';
  topK: number;
  page: number;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  source: string;
  metadata: {
    chunkId: number;
  };
}

export interface SearchResponse {
  total: number;
  list: SearchResult[];
}

export interface SyncTask {
  id: number;
  vectorId: number;
  taskType: 'sync' | 'manual' | 'full_sync';
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errorMessage: string;
  triggerType: 'cron' | 'manual' | 'api';
  triggerBy: string;
  createdAt: string;
}

export interface SyncTaskListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: SyncTask[];
}

export interface SyncConfigResponse {
  nextSyncAt: string;
}

export const vectorApi = {
  getList: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => 
    request.get<VectorListResponse>('/vectors', params),
  
  create: (data: VectorCreateParams) => request.post<VectorItem>('/vectors/create', data),
  
  update: (id: string, data: { title: string }) => request.put<VectorItem>(`/vectors/${id}`, data),
  
  batchDelete: (ids: string[]) => request.delete('/vectors', { ids }),
  
  delete: (id: string) => request.delete(`/vectors/${id}`),
  
  toggleStatus: (id: string, isEnabled: boolean) => request.put(`/vectors/${id}/status`, { isEnabled }),
  
  checkName: (title: string) => request.post<{ exists: boolean }>('/vectors/check-name', { title }),
  
  configureSync: (id: string, config: { 
    enabled: boolean; 
    expression?: string;
    syncMode?: 'full' | 'incremental';
    incrementalField?: string;
  }) => 
    request.put<SyncConfigResponse>(`/vectors/${id}/sync-config`, config),
  
  triggerSync: (id: string) => 
    request.post<{ taskId: number }>(`/vectors/${id}/sync`),
  
  getSyncTasks: (id: string, params?: { page?: number; pageSize?: number; status?: string }) => 
    request.get<SyncTaskListResponse>(`/vectors/${id}/sync-tasks`, params),
  
  getSyncTaskDetail: (taskId: number) => 
    request.get<SyncTask>(`/vectors/sync-tasks/${taskId}`),
  
  exportExcel: (ids: string[]) => request.download('/vectors/export', { ids }),
  
  getDatabases: () => request.get<DatabaseItem[]>('/vectors/wizard/databases'),
  
  getTables: (dbId: string) => request.get<TableItem[]>('/vectors/wizard/tables', { dbId }),
  
  getFields: (dbId: string, tableId: string) => request.get<FieldItem[]>('/vectors/wizard/fields', { dbId, tableId }),
  
  getPrimaryKey: (dbId: string, tableId: string) => request.get<PrimaryKeyInfo>('/vectors/wizard/primary-key', { dbId, tableId }),
  
  getPrimaryKeys: (dbId: string, tableIds: string[]) => request.get<Record<string, PrimaryKeyInfo | null>>('/vectors/wizard/primary-key', { dbId, tableIds: tableIds.join(',') }),
};

export const searchApi = {
    search: (data: SearchParams) => request.post<SearchResponse>('/search/vector', data)
};
