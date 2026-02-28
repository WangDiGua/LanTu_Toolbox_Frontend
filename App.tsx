import React, { Suspense, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { TopLayout } from './layout/TopLayout';
import { Login } from './pages/Login';
import { ToastProvider } from './components/Toast';
import { StoreProvider, useStore, hasPermission } from './store';
import { APP_CONFIG } from './config';
import { appRoutes, RouteConfig, componentMap } from './router';
import { Loader2 } from 'lucide-react';
import { isAuthInvalidated } from './api/request';

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center text-slate-400">
    <Loader2 size={32} className="animate-spin" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
  if (!token || isAuthInvalidated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AuthGuard: React.FC<{ 
  children: React.ReactNode; 
  permissions?: string[];
  roles?: string[];
}> = ({ children, permissions, roles }) => {
  const { state } = useStore();
  const userRole = state.user?.roleKey || state.user?.role || 'viewer';
  const userPermissions = state.permissions || state.user?.permissions || [];
  
  if (!state.initialized) {
    return <PageLoader />;
  }
  
  if (roles && roles.length > 0) {
    if (!roles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  if (permissions && permissions.length > 0) {
    const hasAny = permissions.some(p => hasPermission(userPermissions, p));
    if (!hasAny) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

const buildDynamicRoutes = (menus: any[]): RouteConfig[] => {
  const routes: RouteConfig[] = [];
  
  const processMenu = (menu: any) => {
    if (menu.menuType === 'button' || !menu.path || !menu.component) return;
    
    const Component = componentMap[menu.component];
    if (!Component) return;
    
    const route: RouteConfig = {
      path: menu.path.replace(/^\//, ''),
      component: Component,
      permissions: menu.perms ? [menu.perms] : undefined,
      roles: menu.roles,
      meta: { title: menu.title }
    };
    
    routes.push(route);
    
    if (menu.children && menu.children.length > 0) {
      menu.children.forEach(processMenu);
    }
  };
  
  menus.forEach(processMenu);
  return routes;
};

const AppRoutes = () => {
  const { state } = useStore();
  const LayoutComponent = state.layoutMode === 'top' ? TopLayout : MainLayout;
  
  const routes = useMemo(() => {
    if (state.menus && state.menus.length > 0) {
      const dynamicRoutes = buildDynamicRoutes(state.menus);
      const staticPaths = ['profile'];
      
      const mergedRoutes = [...dynamicRoutes];
      
      appRoutes.forEach(route => {
        if (staticPaths.includes(route.path) || !mergedRoutes.find(r => r.path === route.path)) {
          mergedRoutes.push(route);
        }
      });
      
      return mergedRoutes;
    }
    return appRoutes;
  }, [state.menus]);

  const renderRoutes = (routeList: RouteConfig[]) => {
    return routeList.map((route) => {
      return (
        <Route
          key={route.path}
          path={route.path}
          element={
            <AuthGuard permissions={route.permissions} roles={route.roles}>
              <Suspense fallback={<PageLoader />}>
                <route.component />
              </Suspense>
            </AuthGuard>
          }
        >
          {route.children && renderRoutes(route.children)}
        </Route>
      );
    });
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <LayoutComponent />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {renderRoutes(routes)}
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  );
};

export default App;
