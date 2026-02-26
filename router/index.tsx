import React from 'react';

const Dashboard = React.lazy(() => import('../pages/Dashboard').then(module => ({ default: module.Dashboard })));
const VectorList = React.lazy(() => import('../pages/VectorList').then(module => ({ default: module.VectorList })));
const VectorSearch = React.lazy(() => import('../pages/VectorSearch').then(module => ({ default: module.VectorSearch })));
const KBConfig = React.lazy(() => import('../pages/KBConfig').then(module => ({ default: module.KBConfig })));
const KBRetrieval = React.lazy(() => import('../pages/KBRetrieval').then(module => ({ default: module.KBRetrieval })));
const LLMClean = React.lazy(() => import('../pages/LLMClean').then(module => ({ default: module.LLMClean })));
const Settings = React.lazy(() => import('../pages/Settings').then(module => ({ default: module.Settings })));
const Profile = React.lazy(() => import('../pages/Profile').then(module => ({ default: module.Profile })));
const APIDocs = React.lazy(() => import('../pages/APIDocs').then(module => ({ default: module.APIDocs })));
const ConnectionManagement = React.lazy(() => import('../pages/settings/ConnectionManagement').then(module => ({ default: module.ConnectionManagement })));
const MenuManagement = React.lazy(() => import('../pages/settings/MenuManagement').then(module => ({ default: module.MenuManagement })));
const UserManagement = React.lazy(() => import('../pages/settings/UserManagement').then(module => ({ default: module.UserManagement })));
const RoleManagement = React.lazy(() => import('../pages/settings/RoleManagement').then(module => ({ default: module.RoleManagement })));
const SystemSecurity = React.lazy(() => import('../pages/settings/SystemSecurity').then(module => ({ default: module.SystemSecurity })));
const SystemLogs = React.lazy(() => import('../pages/settings/SystemLogs').then(module => ({ default: module.SystemLogs })));

export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  permissions?: string[];
  roles?: string[];
  children?: RouteConfig[];
  meta?: {
    title: string;
    icon?: React.ReactNode;
  };
}

export const componentMap: Record<string, React.ComponentType<any>> = {
  'Dashboard': Dashboard,
  'VectorList': VectorList,
  'VectorSearch': VectorSearch,
  'KBConfig': KBConfig,
  'KBRetrieval': KBRetrieval,
  'LLMClean': LLMClean,
  'Settings': Settings,
  'Profile': Profile,
  'APIDocs': APIDocs,
  'ConnectionManagement': ConnectionManagement,
  'MenuManagement': MenuManagement,
  'UserManagement': UserManagement,
  'RoleManagement': RoleManagement,
  'SystemSecurity': SystemSecurity,
  'SystemLogs': SystemLogs,
};

export const defaultRoutes: RouteConfig[] = [
  {
    path: 'dashboard',
    component: Dashboard,
    permissions: ['dashboard:view'],
    meta: { title: '仪表盘' }
  },
  {
    path: 'vector',
    component: VectorList,
    permissions: ['vector:manage'],
    roles: ['admin', 'editor'],
    meta: { title: '向量管理' }
  },
  {
    path: 'vector-search',
    component: VectorSearch,
    permissions: ['vector:search'],
    meta: { title: '向量搜索' }
  },
  {
    path: 'kb/config',
    component: KBConfig,
    permissions: ['kb:config'],
    roles: ['admin', 'editor'],
    meta: { title: '知识库配置' }
  },
  {
    path: 'kb/retrieval',
    component: KBRetrieval,
    permissions: ['kb:retrieval'],
    meta: { title: '知识库检索' }
  },
  {
    path: 'tools/llm-clean',
    component: LLMClean,
    permissions: ['tools:clean'],
    roles: ['admin', 'editor'],
    meta: { title: '大模型输出清洁' }
  },
  {
    path: 'docs',
    component: APIDocs,
    permissions: ['api:view'],
    meta: { title: 'API 文档' }
  },
  {
    path: 'settings/*',
    component: Settings,
    permissions: ['system:view'],
    roles: ['admin'],
    meta: { title: '系统设置' }
  },
  {
    path: 'connections',
    component: ConnectionManagement,
    permissions: ['connection:view'],
    roles: ['admin'],
    meta: { title: '数据源管理' }
  },
  {
    path: 'profile',
    component: Profile,
    meta: { title: '个人中心' }
  }
];

export const appRoutes = defaultRoutes;
