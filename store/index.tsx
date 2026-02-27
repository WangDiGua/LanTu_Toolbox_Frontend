import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { APP_CONFIG } from '../config';
import { BackgroundTask, MenuItem, User } from '../types';
import { transformMenuData } from '../utils';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  time: string;
  read: boolean;
}

interface AppState {
  themeMode: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: number;
  fontFamily: 'default' | 'serif' | 'mono' | 'rounded';
  pageTransition: 'fade' | 'slide' | 'scale' | 'flip' | 'zoom' | 'rotate' | 'none'; 
  layoutMode: 'sidebar' | 'top';
  user: User | null;
  menus: MenuItem[];
  permissions: string[];
  notifications: NotificationItem[];
  tasks: BackgroundTask[];
  initialized: boolean;
}

type Action = 
  | { type: 'SET_THEME_MODE'; payload: 'light' | 'dark' | 'system' }
  | { type: 'SET_PRIMARY_COLOR'; payload: string }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'SET_FONT_FAMILY'; payload: 'default' | 'serif' | 'mono' | 'rounded' }
  | { type: 'SET_PAGE_TRANSITION'; payload: 'fade' | 'slide' | 'scale' | 'flip' | 'zoom' | 'rotate' | 'none' }
  | { type: 'SET_LAYOUT_MODE'; payload: 'sidebar' | 'top' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_MENUS'; payload: MenuItem[] }
  | { type: 'SET_PERMISSIONS'; payload: string[] }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationItem }
  | { type: 'SET_NOTIFICATIONS'; payload: NotificationItem[] }
  | { type: 'MERGE_NOTIFICATIONS'; payload: NotificationItem[] }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { id: string; read: boolean } }
  | { type: 'MARK_ALL_READ' }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'ADD_TASK'; payload: BackgroundTask }
  | { type: 'SET_TASKS'; payload: BackgroundTask[] }
  | { type: 'UPDATE_TASK'; payload: { id: string; progress: number; status?: BackgroundTask['status'] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_INITIALIZED'; payload: boolean };

const initialState: AppState = {
  themeMode: 'light',
  primaryColor: '#2563eb',
  fontSize: 16,
  fontFamily: 'default',
  pageTransition: 'fade',
  layoutMode: 'sidebar',
  user: null,
  menus: [],
  permissions: [],
  notifications: [], 
  tasks: [],
  initialized: false,
};

const loadPersistedState = (): Partial<AppState> => {
  try {
    const savedTheme = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.THEME);
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      return {
        themeMode: parsed.mode || 'light',
        primaryColor: parsed.color || '#2563eb',
        fontSize: parsed.fontSize || 16,
        fontFamily: parsed.fontFamily || 'default',
        pageTransition: parsed.pageTransition || 'fade',
        layoutMode: parsed.layoutMode || 'sidebar',
      };
    }
  } catch (e) {
    console.error("Failed to load persisted state");
  }
  return {};
};

const createInitialState = (): AppState => {
  const persisted = loadPersistedState();
  return {
    ...initialState,
    ...persisted,
  };
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_THEME_MODE':
      return { ...state, themeMode: action.payload };
    case 'SET_PRIMARY_COLOR':
      return { ...state, primaryColor: action.payload };
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload };
    case 'SET_FONT_FAMILY':
      return { ...state, fontFamily: action.payload };
    case 'SET_PAGE_TRANSITION':
      return { ...state, pageTransition: action.payload };
    case 'SET_LAYOUT_MODE':
      return { ...state, layoutMode: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_MENUS':
      return { ...state, menus: action.payload };
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'MERGE_NOTIFICATIONS': {
      const existingIds = new Set(state.notifications.map(n => n.id));
      const newItems = action.payload.filter(n => !existingIds.has(n.id));
      return { 
        ...state, 
        notifications: [...newItems, ...state.notifications].slice(0, 100)
      };
    }
    case 'MARK_NOTIFICATION_READ':
      return { 
        ...state, 
        notifications: state.notifications.map(n => 
          n.id === action.payload.id ? { ...n, read: action.payload.read } : n
        )
      };
    case 'MARK_ALL_READ':
      return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === action.payload.id 
            ? { ...t, progress: action.payload.progress, status: action.payload.status || t.status }
            : t
        )
      };
    case 'LOGOUT':
      return { ...state, user: null, menus: [], permissions: [], notifications: [], tasks: [] };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    default:
      return state;
  }
};

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, null, createInitialState);

  useEffect(() => {
    const savedUser = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_INFO);
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (e) {
        console.error("Failed to parse user info");
      }
    }

    const savedPermissions = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PERMISSIONS);
    if (savedPermissions) {
      try {
        const permissions = JSON.parse(savedPermissions);
        dispatch({ type: 'SET_PERMISSIONS', payload: permissions });
      } catch (e) {
        console.error("Failed to parse permissions");
      }
    }

    const savedMenus = localStorage.getItem('menus');
    if (savedMenus) {
      try {
        const menus = JSON.parse(savedMenus);
        if (menus && menus.length > 0) {
          const firstMenu = menus[0];
          if ('parentId' in firstMenu || 'isVisible' in firstMenu) {
            dispatch({ type: 'SET_MENUS', payload: menus });
          } else {
            const transformedMenus = transformMenuData(menus);
            dispatch({ type: 'SET_MENUS', payload: transformedMenus });
          }
        }
      } catch (e) {
        console.error("Failed to parse menus");
      }
    }

    dispatch({ type: 'SET_INITIALIZED', payload: true });
  }, []);

  useEffect(() => {
    if (state.initialized) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.THEME, JSON.stringify({
        mode: state.themeMode,
        color: state.primaryColor,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        pageTransition: state.pageTransition,
        layoutMode: state.layoutMode
      }));
    }
  }, [state.themeMode, state.primaryColor, state.fontSize, state.fontFamily, state.pageTransition, state.layoutMode, state.initialized]);

  useEffect(() => {
    if (!state.initialized) return;
    
    const applyTheme = () => {
      let isDark = false;
      if (state.themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = state.themeMode === 'dark';
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (state.themeMode === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);

  }, [state.themeMode, state.initialized]);

  useEffect(() => {
    if (!state.initialized) return;
    document.documentElement.style.setProperty('--primary', state.primaryColor);
    document.documentElement.style.setProperty('--primary-hover', state.primaryColor); 
  }, [state.primaryColor, state.initialized]);

  useEffect(() => {
    if (!state.initialized) return;
    document.documentElement.style.fontSize = `${state.fontSize}px`;
  }, [state.fontSize, state.initialized]);

  useEffect(() => {
    if (!state.initialized) return;
    const root = document.documentElement;
    root.classList.remove('font-default', 'font-serif', 'font-mono', 'font-rounded');
    root.classList.add(`font-${state.fontFamily}`);
  }, [state.fontFamily, state.initialized]);

  if (!state.initialized) {
    return (
      <StoreContext.Provider value={{ state, dispatch }}>
        {children}
      </StoreContext.Provider>
    );
  }

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

export const hasPermission = (userPermissions: string[], permission: string): boolean => {
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(permission)) return true;
  
  const permParts = permission.split(':');
  if (permParts.length === 2) {
    const [module, action] = permParts;
    if (userPermissions.includes(`${module}:*`)) return true;
  }
  
  return false;
};

export const hasAnyPermission = (userPermissions: string[], permissions: string[]): boolean => {
  return permissions.some(p => hasPermission(userPermissions, p));
};
