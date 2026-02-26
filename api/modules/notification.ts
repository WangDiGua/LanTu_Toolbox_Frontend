import { request } from '../request';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  relatedType?: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  total: number;
  unreadCount: number;
  records: NotificationItem[];
}

export const notificationApi = {
  getList: (params?: { isRead?: number; page?: number; pageSize?: number }) => 
    request.get<NotificationListResponse>('/notifications', params),
  
  markAsRead: (id: number) => 
    request.post(`/notifications/${id}/read`),
  
  markAllAsRead: () => 
    request.post('/notifications/read-all'),
  
  clearAll: () => 
    request.delete('/notifications'),
};
