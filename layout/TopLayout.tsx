import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import * as Icons from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../utils';
import { ThemeSettings } from '../components/ThemeSettings';
import { debounce } from '../utils';
import { useStore } from '../store';
import { APP_CONFIG } from '../config';
import { useToast } from '../components/Toast';
import { sseClient, SSEMessage, TaskEvent, NotificationEvent, notificationApi } from '../api';
import { MenuItem } from '../types';
import { Logo } from '../components/Logo';
import { ConfirmDialog } from '../components/ConfirmDialog';

const getIcon = (iconName?: string, size: number = 18) => {
  if (!iconName) return null;
  const Icon = (Icons as any)[iconName];
  if (!Icon) return <Icons.HelpCircle size={size} />;
  return <Icon size={size} />;
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
      { id: 23, parentId: 2, title: '同步向量', icon: 'ClipboardList', path: '/vector/sync-logs', sort: 3, isVisible: true, roles: ['admin', 'editor'] },
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
      icon: getIcon(menu.icon, 18),
      path: menu.path && menu.path.trim() ? menu.path : '/dashboard',
      children: menu.children
        ?.filter(child => child.isVisible !== false && child.menuType !== 'button')
        .map(child => ({
          id: child.id,
          title: child.title,
          icon: getIcon(child.icon, 16),
          path: child.path && child.path.trim() ? child.path : '/dashboard',
        })) as MenuItemRender[]
    }));
};

const SEARCHABLE_ROUTES = [
  { title: '仪表盘', path: '/dashboard', icon: getIcon('LayoutDashboard', 16) },
  { title: '向量管理', path: '/vector', icon: getIcon('Database', 16) },
  { title: '向量搜索', path: '/vector-search', icon: getIcon('Search', 16) },
  { title: '同步向量', path: '/vector/sync-logs', icon: getIcon('BarChart3', 16) },
  { title: '知识库配置', path: '/kb/config', icon: getIcon('Book', 16) },
  { title: '知识库检索', path: '/kb/retrieval', icon: getIcon('Search', 16) },
  { title: '大模型输出清洁', path: '/tools/llm-clean', icon: getIcon('Eraser', 16) },
  { title: '菜单管理', path: '/settings/menus', icon: getIcon('List', 16) },
  { title: '用户管理', path: '/settings/users', icon: getIcon('Users', 16) },
  { title: '角色管理', path: '/settings/roles', icon: getIcon('Shield', 16) },
  { title: '系统安全', path: '/settings/security', icon: getIcon('Lock', 16) },
  { title: '系统日志', path: '/settings/logs', icon: getIcon('FileText', 16) },
  { title: '个人中心', path: '/profile', icon: getIcon('User', 16) },
];

export const TopLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useStore();
  const { success: toastSuccess } = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof SEARCHABLE_ROUTES>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const menuItems: MenuItemRender[] = useMemo(() => {
    if (state.menus && state.menus.length > 0) {
      return convertMenus(state.menus);
    }
    return convertMenus(defaultMenus);
  }, [state.menus]);

  useEffect(() => {
    const handleSSEMessage = (message: SSEMessage) => {
      if (message.type === 'task_update') {
        const task = message.data as TaskEvent;
        dispatch({ type: 'SET_TASKS', payload: [task] });
      } else if (message.type === 'tasks_list') {
        const tasks = (message.data as TaskEvent[]).map((t: TaskEvent) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          progress: t.progress,
          startTime: t.startTime
        }));
        dispatch({ type: 'SET_TASKS', payload: tasks });
      } else if (message.type === 'notification') {
        const notification = message.data as NotificationEvent;
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      } else if (message.type === 'notifications_list') {
        const newNotifications = (message.data as NotificationEvent[]).map((n: NotificationEvent) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          time: n.time,
          read: n.read
        }));
        dispatch({ 
          type: 'MERGE_NOTIFICATIONS', 
          payload: newNotifications 
        });
      } else if (message.type === 'notification_read') {
        const { id, read } = message.data as { id: string; read: boolean };
        dispatch({ 
          type: 'MARK_NOTIFICATION_READ', 
          payload: { id, read }
        });
      }
    };

    sseClient.connect();
    const unsubscribe = sseClient.subscribe(handleSSEMessage);

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const handleLogout = () => {
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.PERMISSIONS);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REMEMBER_ME);
    localStorage.removeItem('menus');
    dispatch({ type: 'LOGOUT' });
    toastSuccess('已退出登录');
    navigate('/login');
  };

  const debouncedSearch = useRef(
      debounce((query: string) => {
        if (query.trim() === '') {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }
        const filtered = SEARCHABLE_ROUTES.filter(route => 
            route.title.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
        setShowSearchDropdown(true);
      }, 300)
  ).current;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSearchResultClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationApi.markAllAsRead();
      if (res.code === 200) {
        dispatch({ type: 'MARK_ALL_READ' });
        toastSuccess('已全部标记为已读');
      }
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const res = await notificationApi.clearAll();
      if (res.code === 200) {
        dispatch({ type: 'CLEAR_NOTIFICATIONS' });
        toastSuccess('已清空所有通知');
        setShowClearConfirm(false);
      }
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  const handleNotificationClick = async (note: any) => {
    setSelectedNotification(note);
    
    if (!note.read) {
      try {
        const res = await notificationApi.markAsRead(Number(note.id));
        if (res.code === 200) {
          dispatch({ 
            type: 'MARK_NOTIFICATION_READ', 
            payload: { id: note.id, read: true }
          });
        }
      } catch (e) {
        console.error('Failed to mark as read:', e);
      }
    }
  };

  const handleNotificationDetailClose = () => {
    setSelectedNotification(null);
  };

  const handleNotificationNavigate = () => {
    if (selectedNotification?.relatedType === 'task' && selectedNotification?.relatedId) {
      navigate(`/vector`);
    }
    setSelectedNotification(null);
    setShowNotifications(false);
  };

  const isActive = (path: string) => {
    if (path === '/vector') {
      return location.pathname === '/vector';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setShowSearchDropdown(false);
        }
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node) && !selectedNotification) {
            setShowNotifications(false);
        }
        if (navRef.current && !navRef.current.contains(event.target as Node)) {
            setActiveDropdown(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedNotification]);

  const user = state.user || { username: 'Guest', role: 'viewer', roleKey: 'viewer', email: 'guest@vector.com', avatar: 'GU' };
  const displayRole = user.role || user.roleKey || 'viewer';
  const unreadCount = state.notifications.filter(n => !n.read).length;
  const transitionClass = `page-transition-${state.pageTransition}`;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden dark:bg-slate-950">
      {/* Top Header */}
      <header className="bg-surface border-b border-slate-200 h-14 flex items-center justify-between px-6 shadow-sm z-20 dark:bg-slate-900 dark:border-slate-800">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Logo size="sm" showSubtitle={true} />

          {/* Navigation */}
          <nav ref={navRef} className="flex items-center gap-1">
            {menuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const active = isActive(item.path);
              
              return (
                <div 
                  key={item.id} 
                  className="relative"
                  onMouseEnter={() => hasChildren && setActiveDropdown(String(item.id))}
                  onMouseLeave={() => hasChildren && setActiveDropdown(null)}
                >
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        setActiveDropdown(activeDropdown === String(item.id) ? null : String(item.id));
                      } else {
                        navigate(item.path);
                        setActiveDropdown(null);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      active 
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    {hasChildren && <Icons.ChevronDown size={14} className={cn("transition-transform", activeDropdown === String(item.id) && "rotate-180")} />}
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {hasChildren && activeDropdown === String(item.id) && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 dark:bg-slate-800 dark:border-slate-700"
                      >
                        {item.children!.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => {
                              navigate(child.path);
                              setActiveDropdown(null);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                              isActive(child.path)
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                            )}
                          >
                            {child.icon}
                            <span>{child.title}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-64" ref={searchRef}>
            <Input 
                placeholder="搜索菜单..." 
                className="bg-slate-100 border-transparent focus:bg-white h-8 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                leftIcon={<Icons.Search size={14} />}
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowSearchDropdown(true)}
            />
            <AnimatePresence>
                {showSearchDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 max-h-64 overflow-y-auto dark:bg-slate-800 dark:border-slate-700"
                    >
                        {searchResults.length > 0 ? (
                            <ul>
                                {searchResults.map((result) => (
                                    <li key={result.path}>
                                        <button
                                            onClick={() => handleSearchResultClick(result.path)}
                                            className="w-full flex items-center px-3 py-2 hover:bg-slate-50 transition-colors text-left dark:hover:bg-slate-700"
                                        >
                                            <span className="text-slate-400 mr-2">{result.icon}</span>
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{result.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-3 py-2 text-sm text-slate-500 text-center dark:text-slate-400">未找到</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* Settings */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-slate-500 hover:text-primary p-1.5 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:bg-slate-800"
            title="系统配置"
          >
            <Icons.Settings size={18} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-slate-500 hover:text-primary p-1.5 hover:bg-slate-100 rounded-lg relative dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Icons.Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden dark:bg-slate-800 dark:border-slate-700"
                >
                  <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center dark:border-slate-700">
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-white">通知</h3>
                    <div className="flex gap-1">
                      <button onClick={handleMarkAllRead} className="text-xs text-blue-600 dark:text-blue-400" title="全部已读"><Icons.Check size={12} /></button>
                      <button onClick={() => setShowClearConfirm(true)} className="text-xs text-slate-400" title="清空通知"><Icons.X size={12} /></button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {state.notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">暂无通知</div>
                    ) : (
                      state.notifications.map((note) => (
                        <div 
                          key={note.id} 
                          onClick={() => handleNotificationClick(note)}
                          className={cn(
                            "px-3 py-2 border-b border-slate-50 hover:bg-slate-50 last:border-0 cursor-pointer relative dark:border-slate-700 dark:hover:bg-slate-700", 
                            !note.read && "bg-blue-50/30 dark:bg-blue-900/10"
                          )}
                        >
                          {!note.read && <div className="absolute left-2 top-4 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{note.title}</span>
                            <span className="text-[10px] text-slate-400">{note.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{note.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative"
            onMouseEnter={() => setUserMenuOpen(true)}
            onMouseLeave={() => setUserMenuOpen(false)}
          >
            <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-primary font-semibold text-xs dark:bg-slate-700 dark:text-white">
                {user.avatar || 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.username}</span>
              <Icons.ChevronDown size={14} className="text-slate-400" />
            </button>

            <AnimatePresence>
            {userMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl py-1 border border-slate-100 z-50 dark:bg-slate-800 dark:border-slate-700"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-900 dark:text-white capitalize">{displayRole}</p>
                </div>
                <button 
                  onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Icons.User size={12} className="mr-2" /> 个人资料
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center dark:hover:bg-red-900/20"
                >
                  <Icons.LogOut size={12} className="mr-2" /> 退出
                </button>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-6 flex flex-col dark:bg-slate-950">
        <Breadcrumb />
        <div className="flex-1 overflow-auto relative custom-scrollbar">
          <div key={location.pathname} className={cn("h-full", transitionClass)}>
            <Outlet />
          </div>
        </div>
      </main>

      <ThemeSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleNotificationDetailClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden dark:bg-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    selectedNotification.type === 'success' ? 'bg-green-500' :
                    selectedNotification.type === 'error' ? 'bg-red-500' :
                    selectedNotification.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  )}></span>
                  <h3 className="font-semibold text-slate-800 dark:text-white">{selectedNotification.title}</h3>
                </div>
                <button 
                  onClick={handleNotificationDetailClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Icons.X size={18} />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                  {selectedNotification.message}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>{selectedNotification.time}</span>
                  {selectedNotification.read && (
                    <span className="text-green-500">已读</span>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 dark:bg-slate-700/50">
                {selectedNotification.relatedType === 'task' && selectedNotification.relatedId && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNotificationNavigate}
                  >
                    查看相关任务
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNotificationDetailClose}
                >
                  关闭
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearNotifications}
        title="清空通知"
        message="确定要清空所有通知吗？此操作不可恢复。"
        confirmText="清空"
        cancelText="取消"
        type="danger"
      />
    </div>
  );
};
