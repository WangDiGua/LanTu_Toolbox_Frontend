import { request } from '../request';

export interface Connection {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  description?: string;
  isEnabled: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SupportedDatabase {
  type: string;
  name: string;
  defaultPort: number;
}

export interface ConnectionListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: Connection[];
}

export interface ConnectionCreateParams {
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  description?: string;
}

export interface ConnectionUpdateParams {
  name?: string;
  type?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  description?: string;
}

export interface ConnectionTestParams {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface DatabaseInfo {
  databaseName: string;
}

export interface TableInfo {
  tableName: string;
  tableType: string;
  engine: string;
  tableRows: number;
  tableComment: string;
}

export interface FieldInfo {
  columnName: string;
  dataType: string;
  columnType: string;
  isNullable: string;
  columnKey: string;
  columnComment: string;
}

export const connectionApi = {
  getList: (params?: { name?: string; type?: string; page?: number; pageSize?: number }) => 
    request.get<ConnectionListResponse>('/connections', params),

  getAll: () => 
    request.get<Connection[]>('/connections/all'),

  getEnabled: () => 
    request.get<Connection | null>('/connections/enabled'),

  getSupportedTypes: () => 
    request.get<SupportedDatabase[]>('/connections/supported-types'),

  getDetail: (id: number) => 
    request.get<Connection>(`/connections/${id}`),

  create: (data: ConnectionCreateParams) => 
    request.post<{ id: number }>('/connections', data),

  update: (id: number, data: ConnectionUpdateParams) => 
    request.put(`/connections/${id}`, data),

  delete: (id: number) => 
    request.delete(`/connections/${id}`),

  enable: (id: number) => 
    request.post(`/connections/${id}/enable`),

  disable: (id: number) => 
    request.post(`/connections/${id}/disable`),

  test: (data: ConnectionTestParams) => 
    request.post('/connections/test', data),

  testById: (id: number) => 
    request.post(`/connections/${id}/test`),

  getDatabases: (id: number) => 
    request.get<DatabaseInfo[]>(`/connections/${id}/databases`),

  getTables: (id: number, dbName: string) => 
    request.get<TableInfo[]>(`/connections/${id}/databases/${dbName}/tables`),

  getFields: (id: number, dbName: string, tableName: string) => 
    request.get<FieldInfo[]>(`/connections/${id}/databases/${dbName}/tables/${tableName}/fields`),
};
