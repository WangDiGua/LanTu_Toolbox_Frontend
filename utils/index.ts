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
    result = chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getNextCronRunTime(cronExpression: string): Date | null {
  if (!cronExpression || !cronExpression.trim()) return null;
  
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0);
  next.setMilliseconds(0);
  
  next.setMinutes(next.getMinutes() + 1);
  
  const parseField = (field: string, min: number, max: number): number[] => {
    if (field === '*') {
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    }
    
    if (field.startsWith('*/')) {
      const step = parseInt(field.slice(2));
      if (isNaN(step) || step <= 0) return [];
      const values: number[] = [];
      for (let i = min; i <= max; i += step) {
        values.push(i);
      }
      return values;
    }
    
    if (field.includes(',')) {
      return field.split(',').map(v => parseInt(v)).filter(v => !isNaN(v) && v >= min && v <= max);
    }
    
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(v => parseInt(v));
      if (isNaN(start) || isNaN(end)) return [];
      const values: number[] = [];
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) values.push(i);
      }
      return values;
    }
    
    const value = parseInt(field);
    return isNaN(value) ? [] : [value];
  };
  
  const minutes = parseField(minute, 0, 59);
  const hours = parseField(hour, 0, 23);
  const daysOfMonth = parseField(dayOfMonth, 1, 31);
  const months = parseField(month, 1, 12);
  const daysOfWeek = parseField(dayOfWeek, 0, 6);
  
  if (minutes.length === 0 || hours.length === 0) return null;
  
  for (let attempt = 0; attempt < 366 * 24 * 60; attempt++) {
    const m = next.getMinutes();
    const h = next.getHours();
    const dom = next.getDate();
    const mon = next.getMonth() + 1;
    const dow = next.getDay();
    
    const minuteMatch = minutes.includes(m);
    const hourMatch = hours.includes(h);
    const monthMatch = months.length === 0 || month === '*' || months.includes(mon);
    
    let dayMatch = true;
    if (dayOfMonth !== '*' && dayOfWeek !== '*') {
      dayMatch = daysOfMonth.includes(dom) || daysOfWeek.includes(dow);
    } else if (dayOfMonth !== '*') {
      dayMatch = daysOfMonth.includes(dom);
    } else if (dayOfWeek !== '*') {
      dayMatch = daysOfWeek.includes(dow);
    }
    
    if (minuteMatch && hourMatch && monthMatch && dayMatch) {
      return next;
    }
    
    next.setMinutes(next.getMinutes() + 1);
  }
  
  return null;
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