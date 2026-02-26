import React from 'react';

export interface User {
  id: number;
  username: string;
  nickname?: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  role?: string;
  roleKey?: string;
  permissions?: string[];
  status: number;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  bio?: string;
  location?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  roleKey: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: number;
  parentId: number;
  title: string;
  path: string;
  component?: string;
  icon?: string;
  sort: number;
  isVisible: boolean;
  menuType?: 'directory' | 'menu' | 'button';
  perms?: string;
  roles: string[];
  children?: MenuItem[];
}

export interface VectorItem {
  id: string;
  title: string;
  alias?: string;
  description?: string;
  collectionName?: string;
  sourceType?: string;
  content: string;
  dimensions: number;
  source: string;
  status: 'indexed' | 'pending' | 'error';
  isMultiTable: boolean;
  joinRules?: string;
  selectedFields: string;
  advancedConfig?: {
    indexType: string;
    metric: string;
    dimensions: number;
  };
  dbName?: string;
  tableNames?: string[];
  cronConfig?: {
    enabled: boolean;
    expression: string;
    syncMode?: 'full' | 'incremental';
    incrementalField?: string;
  };
  lastSyncAt?: string;
  nextSyncAt?: string;
  lastSyncValue?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface SystemLog {
  id: number;
  userId?: number;
  username?: string;
  action: string;
  requestMethod?: string;
  requestPath?: string;
  requestParams?: string;
  responseCode?: number;
  responseTime?: number;
  userAgent?: string;
  module?: string;
  type: 'login' | 'operation' | 'error';
  ip?: string;
  details?: string;
  status: 'success' | 'failed';
  createdAt: string;
}

export interface BackgroundTask {
  id: string;
  name: string;
  status: 'In Progress' | 'Completed' | 'Failed';
  progress: number;
  startTime: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface DatabaseItem {
  id: string;
  name: string;
  type: string;
}

export interface TableItem {
  id: string;
  name: string;
  rows: number;
  hasPrimaryKey?: boolean;
  comment?: string;
  engine?: string;
  type?: string;
}

export interface FieldItem {
  id: string;
  name: string;
  type: string;
}
