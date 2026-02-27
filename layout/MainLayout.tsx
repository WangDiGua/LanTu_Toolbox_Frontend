import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from '../components/Breadcrumb';
import { Search, Bell, LogOut, User, Settings, LayoutDashboard, Database, Users, Shield, FileText, List, Lock, Book, Wrench, Eraser, X, Check } from 'lucide-react';
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
import { ConfirmDialog } from '../components/ConfirmDialog';

// Search Data Source
const SEARCHABLE_ROUTES = [
  { title: '仪表盘', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { title: '向量管理', path: '/vector', icon: <Database size={16} /> },
  { title: '向量搜索', path: '/vector-search', icon: <Search size={16} /> },
  { title: '知识库配置', path: '/kb/config', icon: <Book size={16} /> },
  { title: '知识库检索', path: '/kb/retrieval', icon: <Search size={16} /> },
  { title: '大模型输出清洁', path: '/tools/llm-clean', icon: <Eraser size={16} /> },
  { title: '菜单管理', path: '/settings/menus', icon: <List size={16} /> },
  { title: '用户管理', path: '/settings/users', icon: <Users size={16} /> },
  { title: '角色管理', path: '/settings/roles', icon: <Shield size={16} /> },
  { title: '系统安全', path: '/settings/security', icon: <Lock size={16} /> },
  { title: '系统日志', path: '/settings/logs', icon: <FileText size={16} /> },
  { title: '个人中心', path: '/profile', icon: <User size={16} /> },
];

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useStore();
  const { success: toastSuccess } = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof SEARCHABLE_ROUTES>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // --- SSE Event Handling ---
  useEffect(() => {
    const handleSSEMessage = (message: SSEMessage) => {
      if (message.type === 'task_update') {
        const task = message.data as TaskEvent;
        dispatch({ 
          type: 'SET_TASKS', 
          payload: [task] 
        });
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

  // Using debounce for search
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setShowSearchDropdown(false);
        }
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node) && !selectedNotification) {
            setShowNotifications(false);
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
    <div className="flex h-screen bg-background overflow-hidden dark:bg-slate-950">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-surface border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10 dark:bg-slate-900 dark:border-slate-800">
          <div className="w-96 relative" ref={searchRef}>
            <Input 
                placeholder="全局搜索菜单 (如: 系统安全, 清洁)..." 
                className="bg-slate-100 border-transparent focus:bg-white transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:bg-slate-800"
                leftIcon={<Search size={16} />}
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowSearchDropdown(true)}
            />
            {/* Search Dropdown */}
            <AnimatePresence>
                {showSearchDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 max-h-64 overflow-y-auto dark:bg-slate-800 dark:border-slate-700"
                    >
                        {searchResults.length > 0 ? (
                            <ul>
                                {searchResults.map((result) => (
                                    <li key={result.path}>
                                        <button
                                            onClick={() => handleSearchResultClick(result.path)}
                                            className="w-full flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-left dark:hover:bg-slate-700"
                                        >
                                            <span className="text-slate-400 mr-3">{result.icon}</span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{result.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center dark:text-slate-400">
                                未找到相关结果
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center space-x-4">
             {/* System Settings Trigger */}
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-slate-500 hover:text-primary transition-colors relative p-2 hover:bg-slate-100 rounded-full dark:text-slate-400 dark:hover:bg-slate-800"
                title="系统配置"
             >
                <Settings size={20} />
             </button>

             {/* Notification Bell */}
             <div className="relative" ref={notificationRef}>
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-slate-500 hover:text-primary transition-colors relative p-2 hover:bg-slate-100 rounded-full dark:text-slate-400 dark:hover:bg-slate-800"
                 >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white dark:border-slate-900 font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                 </button>

                 <AnimatePresence>
                    {showNotifications && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden dark:bg-slate-800 dark:border-slate-700"
                        >
                            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800 dark:border-slate-700">
                                <h3 className="font-semibold text-sm text-slate-800 dark:text-white">系统通知</h3>
                                <div className="flex gap-2">
                                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400" title="全部已读">
                                        <Check size={14} />
                                    </button>
                                    <button onClick={() => setShowClearConfirm(true)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="清空">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {state.notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">暂无新通知</div>
                                ) : (
                                    state.notifications.map((note) => (
                                        <div 
                                            key={note.id} 
                                            onClick={() => handleNotificationClick(note)}
                                            className={cn(
                                                "px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0 relative cursor-pointer dark:border-slate-700 dark:hover:bg-slate-700", 
                                                !note.read && "bg-blue-50/30 dark:bg-blue-900/10"
                                            )}
                                        >
                                            {!note.read && <div className="absolute left-2 top-4 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium text-sm text-slate-800 dark:text-slate-200 pl-2">{note.title}</span>
                                                <span className="text-[10px] text-slate-400">{note.time}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 pl-2 leading-relaxed dark:text-slate-400">{note.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                 </AnimatePresence>
             </div>

             <div className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
            >
                <button 
                    className="flex items-center space-x-2 focus:outline-none p-1 rounded-full hover:bg-slate-100 transition-colors dark:hover:bg-slate-800"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary font-semibold text-sm ring-2 ring-transparent hover:ring-blue-200 transition-all dark:bg-slate-700 dark:text-white dark:hover:ring-slate-600">
                        {user.avatar || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden md:block dark:text-slate-200">{user.username}</span>
                </button>

                <AnimatePresence>
                {userMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-slate-100 ring-1 ring-black ring-opacity-5 z-50 dark:bg-slate-800 dark:border-slate-700"
                    >
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                            <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{displayRole}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        </div>
                        <button 
                            onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <User size={14} className="mr-2" /> 个人资料
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors dark:hover:bg-red-900/20"
                        >
                            <LogOut size={14} className="mr-2" /> 退出登录
                        </button>
                    </motion.div>
                )}
                </AnimatePresence>
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden p-8 flex flex-col dark:bg-slate-950">
            <Breadcrumb />
            <div className="flex-1 overflow-auto relative custom-scrollbar pr-2">
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
                    <X size={18} />
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
    </div>
  );
};