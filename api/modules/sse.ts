import { APP_CONFIG } from '../../config';

export interface TaskEvent {
  id: string;
  name: string;
  status: 'In Progress' | 'Completed' | 'Failed';
  progress: number;
  startTime: string;
}

export interface NotificationEvent {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  time: string;
  read: boolean;
}

export interface SSEMessage {
  type: 'task_update' | 'notification' | 'tasks_list' | 'notifications_list' | 'notification_read' | 'system_log';
  data: TaskEvent | NotificationEvent | TaskEvent[] | NotificationEvent[] | { id: string; read: boolean } | { time: string; level: string; message: string };
}

type SSEEventHandler = (message: SSEMessage) => void;

class SSEClient {
  private eventSource: EventSource | null = null;
  private handlers: SSEEventHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect() {
    if (this.eventSource) {
      return;
    }

    const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
    if (!token) {
      return;
    }

    const url = `${APP_CONFIG.API_BASE_URL}/events?token=${encodeURIComponent(token)}`;
    
    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          this.handlers.forEach(handler => handler(message));
        } catch (e) {
          console.error('Failed to parse SSE message:', e);
        }
      };

      this.eventSource.onerror = () => {
        this.eventSource?.close();
        this.eventSource = null;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };
    } catch (e) {
      console.error('Failed to create EventSource:', e);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.handlers = [];
  }

  subscribe(handler: SSEEventHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  isConnected() {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}

export const sseClient = new SSEClient();
