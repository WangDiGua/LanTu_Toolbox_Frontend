import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MenuItem } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export function generateCaptcha(length = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface RawMenuItem {
  id: number;
  parentId: number;
  title: string;
  path: string;
  component?: string;
  icon?: string;
  sort: number;
  isVisible: number;
  menuType?: 'directory' | 'menu' | 'button';
  perms?: string;
  roles: string[];
  children?: RawMenuItem[];
  createdAt?: string;
  updatedAt?: string;
}

export function transformMenuData(rawMenus: RawMenuItem[]): MenuItem[] {
  return rawMenus.map(menu => ({
    id: menu.id,
    parentId: menu.parentId,
    title: menu.title,
    path: menu.path,
    component: menu.component,
    icon: menu.icon,
    sort: menu.sort,
    isVisible: menu.isVisible === 1,
    menuType: menu.menuType,
    perms: menu.perms,
    roles: menu.roles,
    children: menu.children ? transformMenuData(menu.children) : undefined
  }));
}

/**
 * 防抖函数 (Debounce)
 * 限制函数在一定时间内只能执行一次，最后一次触发生效。
 * 适用于搜索输入框等高频触发场景。
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * 节流函数 (Throttle)
 * 限制函数在一定时间内只能执行一次，规定时间内多次触发只有一次生效。
 * 适用于按钮点击防抖、滚动事件监听等。
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}