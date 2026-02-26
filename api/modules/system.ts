import { request } from '../request';
import { User, Role, SystemLog } from '../../types';

export type MenuType = 'directory' | 'menu' | 'button';

export interface MenuItem {
  id: number;
  parentId: number;
  title: string;
  path: string;
  component?: string;
  icon?: string;
  sort: number;
  isVisible: number;
  menuType: MenuType;
  perms?: string;
  roles: string[];
  children?: MenuItem[];
  createdAt?: string;
  updatedAt?: string;
}

export const menuApi = {
  getList: () => request.get<MenuItem[]>('/settings/menus'),
  getDetail: (id: number) => request.get<MenuItem>(`/settings/menus/${id}`),
  create: (data: Partial<MenuItem>) => request.post<MenuItem>('/settings/menus', data),
  update: (id: number, data: Partial<MenuItem>) => request.put(`/settings/menus/${id}`, data),
  delete: (id: number) => request.delete(`/settings/menus/${id}`),
  batchUpdateSort: (data: { id: number; sort: number }[]) => 
    request.put('/settings/menus/batch-sort', { items: data }),
  getAllPermissions: () => request.get<{ id: string; label: string }[]>('/settings/menus/permissions'),
};

export interface RoleListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: Role[];
}

export const roleApi = {
  getList: (params?: { page?: number; pageSize?: number }) => 
    request.get<RoleListResponse>('/settings/roles', params),
  getByRoleKey: (roleKey: string) => 
    request.get<Role>(`/settings/roles/${roleKey}`),
  create: (data: Partial<Role>) => request.post<Role>('/settings/roles', data),
  update: (id: number, data: Partial<Role>) => request.put<Role>(`/settings/roles/${id}`, data),
  delete: (id: number) => request.delete(`/settings/roles/${id}`),
  updatePermissions: (id: number, permissions: string[]) => 
    request.put(`/settings/roles/${id}/permissions`, { permissions }),
};

export interface UserListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: User[];
}

export const userApi = {
  getList: (params?: { page?: number; pageSize?: number; keyword?: string; status?: number | null }) => 
    request.get<UserListResponse>('/settings/users', params),
  create: (data: Partial<User>) => request.post<User>('/settings/users', data),
  update: (id: number, data: Partial<User>) => request.put<User>(`/settings/users/${id}`, data),
  toggleStatus: (id: number, status: number) => request.put(`/settings/users/${id}/status`, { status }),
  delete: (id: number) => request.delete(`/settings/users/${id}`),
};

export interface IpRecord {
  id: number;
  ip: string;
  location: string;
  accessCount: number;
  lastAccess: string;
  status: 'allowed' | 'blocked';
  createdAt: string;
}

export interface IpListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: IpRecord[];
}

export const securityApi = {
  getIps: (params?: { 
    page?: number; 
    pageSize?: number; 
    status?: string;
  }) => request.get<IpListResponse>('/settings/ips', params),
  addBlock: (data: { ip: string; location?: string; status?: string }) => request.post('/settings/ips', data),
  toggleBlock: (id: number, status: string) => request.put(`/settings/ips/${id}/status`, { status }),
  delete: (id: number) => request.delete(`/settings/ips/${id}`),
};

export interface LogListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: SystemLog[];
}

export const logApi = {
  getList: (params?: { 
    page?: number; 
    pageSize?: number; 
    userId?: number;
    action?: string;
    type?: string;
    method?: string;
    status?: string;
  }) => request.get<LogListResponse>('/settings/logs', params),
  delete: (id: number) => request.delete(`/settings/logs/${id}`),
  setRetention: (days: number) => request.post('/settings/logs/retention', { days }),
  getRetention: () => request.get<{ days: number }>('/settings/logs/retention'),
};

export interface AuditLogListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: any[];
}

export const logAuditApi = {
  getList: (params?: any) => request.get<AuditLogListResponse>('/audit/logs', params),
  export: (params?: any) => request.download('/audit/logs/export', params),
};

export const kbConfigApi = {
  get: () => request.get<any>('/kb/config'),
  update: (data: any) => request.put<any>('/kb/config', data),
};

export const llmApi = {
  clean: (data: { content: string }) => request.post<{ cleaned: string }>('/llm/clean', data),
};
