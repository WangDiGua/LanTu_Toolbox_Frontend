import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MenuManagement } from './settings/MenuManagement';
import { UserManagement } from './settings/UserManagement';
import { RoleManagement } from './settings/RoleManagement';
import { SystemSecurity } from './settings/SystemSecurity';
import { SystemLogs } from './settings/SystemLogs';
import { ConnectionManagement } from './settings/ConnectionManagement';

export const Settings: React.FC = () => {
  const location = useLocation();
  
  const isConnectionPage = location.pathname === '/settings/connections';
  
  if (isConnectionPage) {
    return <ConnectionManagement />;
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">系统设置</h1>
            <p className="text-slate-500 dark:text-slate-400">管理菜单显示、用户访问权限及系统审计日志。</p>
        </div>
        
        <Routes>
            <Route index element={<Navigate to="menus" replace />} />
            <Route path="menus" element={<MenuManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="security" element={<SystemSecurity />} />
            <Route path="logs" element={<SystemLogs />} />
        </Routes>
    </div>
  );
};
