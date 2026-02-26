import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Database, Settings, Users, Shield, FileText, 
    BookOpen, Search as SearchIcon, List, ChevronRight, ChevronDown, 
    Lock, Book, Wrench, Eraser, Server, Cloud, HardDrive, Globe,
    Cpu, Code, Terminal, Layers, Package, Box, Zap, Activity
} from 'lucide-react';
import { cn } from '../utils';
import { APP_CONFIG } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { MenuItem } from '../types';

const iconMap: Record<string, React.ReactNode> = {
    'LayoutDashboard': <LayoutDashboard size={20} />,
    'Database': <Database size={20} />,
    'DatabaseOutlined': <Database size={20} />,
    'Settings': <Settings size={20} />,
    'Users': <Users size={20} />,
    'Shield': <Shield size={20} />,
    'FileText': <FileText size={20} />,
    'BookOpen': <BookOpen size={20} />,
    'Search': <SearchIcon size={20} />,
    'List': <List size={20} />,
    'Lock': <Lock size={20} />,
    'Book': <Book size={20} />,
    'Wrench': <Wrench size={20} />,
    'Eraser': <Eraser size={20} />,
    'Server': <Server size={20} />,
    'Cloud': <Cloud size={20} />,
    'HardDrive': <HardDrive size={20} />,
    'Globe': <Globe size={20} />,
    'Cpu': <Cpu size={20} />,
    'Code': <Code size={20} />,
    'Terminal': <Terminal size={20} />,
    'Layers': <Layers size={20} />,
    'Package': <Package size={20} />,
    'Box': <Box size={20} />,
    'Zap': <Zap size={20} />,
    'Activity': <Activity size={20} />,
};

const getIcon = (iconName?: string, size: number = 20) => {
  if (!iconName) return null;
  const icon = iconMap[iconName];
  if (icon) {
    return React.cloneElement(icon as React.ReactElement, { size });
  }
  return null;
};

const defaultMenus: MenuItem[] = [
  {
    id: 1,
    parentId: 0,
    title: '仪表盘',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    sort: 1,
    isVisible: true,
    roles: ['admin', 'editor', 'viewer']
  },
  {
    id: 2,
    parentId: 0,
    title: '向量配置',
    icon: 'Database',
    path: '/vector-config',
    sort: 2,
    isVisible: true,
    roles: ['admin', 'editor', 'viewer'],
    children: [
      { id: 21, parentId: 2, title: '向量管理', icon: 'Database', path: '/vector', sort: 1, isVisible: true, roles: ['admin', 'editor'] },
      { id: 22, parentId: 2, title: '向量搜索', icon: 'Search', path: '/vector-search', sort: 2, isVisible: true, roles: ['admin', 'editor', 'viewer'] },
    ]
  },
  {
    id: 3,
    parentId: 0,
    title: '知识库',
    icon: 'Book',
    path: '/kb',
    sort: 3,
    isVisible: true,
    roles: ['admin', 'editor', 'viewer'],
    children: [
      { id: 31, parentId: 3, title: '知识库配置', icon: 'Settings', path: '/kb/config', sort: 1, isVisible: true, roles: ['admin', 'editor'] },
      { id: 32, parentId: 3, title: '知识库检索', icon: 'Search', path: '/kb/retrieval', sort: 2, isVisible: true, roles: ['admin', 'editor', 'viewer'] }
    ]
  },
  {
    id: 4,
    parentId: 0,
    title: '节点工具',
    icon: 'Wrench',
    path: '/tools',
    sort: 4,
    isVisible: true,
    roles: ['admin', 'editor'],
    children: [
      { id: 41, parentId: 4, title: '大模型输出清洁', icon: 'Eraser', path: '/tools/llm-clean', sort: 1, isVisible: true, roles: ['admin', 'editor'] }
    ]
  },
  {
    id: 5,
    parentId: 0,
    title: '系统设置',
    icon: 'Settings',
    path: '/settings',
    sort: 5,
    isVisible: true,
    roles: ['admin'],
    children: [
      { id: 51, parentId: 5, title: '菜单管理', path: '/settings/menus', icon: 'List', sort: 1, isVisible: true, roles: ['admin'] },
      { id: 52, parentId: 5, title: '角色管理', path: '/settings/roles', icon: 'Shield', sort: 2, isVisible: true, roles: ['admin'] },
      { id: 53, parentId: 5, title: '用户管理', path: '/settings/users', icon: 'Users', sort: 3, isVisible: true, roles: ['admin'] },
      { id: 54, parentId: 5, title: '系统安全', path: '/settings/security', icon: 'Lock', sort: 4, isVisible: true, roles: ['admin'] },
      { id: 55, parentId: 5, title: '系统日志', path: '/settings/logs', icon: 'FileText', sort: 5, isVisible: true, roles: ['admin'] },
    ]
  },
  {
    id: 6,
    parentId: 0,
    title: 'API 文档',
    icon: 'BookOpen',
    path: '/docs',
    sort: 6,
    isVisible: true,
    roles: ['admin', 'editor', 'viewer']
  }
];

interface MenuItemRender {
  id: number;
  title: string;
  icon?: React.ReactNode;
  path: string;
  children?: MenuItemRender[];
}

const convertMenus = (menus: MenuItem[]): MenuItemRender[] => {
  return menus
    .filter(menu => menu.isVisible !== false && menu.menuType !== 'button')
    .map(menu => ({
      id: menu.id,
      title: menu.title,
      icon: getIcon(menu.icon, 20),
      path: menu.path && menu.path.trim() ? menu.path : '/dashboard',
      children: menu.children
        ?.filter(child => child.isVisible !== false && child.menuType !== 'button')
        .map(child => ({
          id: child.id,
          title: child.title,
          icon: getIcon(child.icon, 18),
          path: child.path && child.path.trim() ? child.path : '/dashboard',
          children: child.children
            ?.filter(c => c.isVisible !== false && c.menuType !== 'button')
            .map(c => ({
              id: c.id,
              title: c.title,
              icon: getIcon(c.icon, 18),
              path: c.path && c.path.trim() ? c.path : '/dashboard'
            })) as MenuItemRender[]
        })) as MenuItemRender[]
    }));
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const menuItems: MenuItemRender[] = useMemo(() => {
    if (state.menus && state.menus.length > 0) {
      return convertMenus(state.menus);
    }
    return convertMenus(defaultMenus);
  }, [state.menus]);

  useEffect(() => {
    const parent = menuItems.find(item => 
      item.children && item.children.some(child => location.pathname.startsWith(child.path))
    );
    if (parent) {
      setExpandedMenus(prev => {
        if (prev.length === 1 && prev[0] === parent.title) return prev;
        return [parent.title];
      });
    }
  }, [location.pathname, menuItems]);

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) 
        ? []
        : [title]
    );
  };

  return (
    <div className="w-64 flex flex-col h-full border-r shadow-xl z-20 transition-colors duration-300
      bg-white border-slate-200 text-slate-600 
      dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
      
      <div 
        className="h-16 flex items-center px-6 border-b transition-colors duration-300 cursor-pointer
        border-slate-100 bg-white
        dark:border-slate-800 dark:bg-slate-900"
        onClick={() => {
          setExpandedMenus([]);
          navigate('/dashboard');
        }}
      >
        <div className="flex items-center gap-2">
          <img src="/LOGO.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">兰途工具箱</span>
        </div>
      </div>

      <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.children && item.children.length > 0 ? (
              <div className="mb-1">
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    'w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200',
                    expandedMenus.includes(item.title)
                      ? 'text-slate-800 bg-slate-100 dark:text-white dark:bg-slate-800/50' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white transition-colors">{item.icon}</span>
                    {item.title}
                  </div>
                  {expandedMenus.includes(item.title) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                <AnimatePresence>
                  {expandedMenus.includes(item.title) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-9 pr-2 py-1 space-y-1">
                        {item.children.map((child) => {
                          const isActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
                          return (
                            <button
                              key={child.id}
                              onClick={() => navigate(child.path)}
                              className={cn(
                                'w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative text-left',
                                isActive
                                  ? 'text-primary bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                              )}
                            >
                              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full"></span>}
                              <span className="mr-3 opacity-80">{child.icon}</span>
                              {child.title}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              (() => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <button
                    onClick={() => {
                      setExpandedMenus([]);
                      navigate(item.path);
                    }}
                    className={cn(
                      'w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-md mb-1 transition-all duration-200 text-left',
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    )}
                  >
                    <span className={cn("mr-3 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white")}>{item.icon}</span>
                    {item.title}
                  </button>
                );
              })()
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t transition-colors duration-300
        border-slate-100 bg-slate-50
        dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs text-slate-500 text-center dark:text-slate-500">
          v1.1.0 Enterprise
        </div>
      </div>
    </div>
  );
};
