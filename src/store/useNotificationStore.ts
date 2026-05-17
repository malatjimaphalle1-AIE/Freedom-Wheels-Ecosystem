import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'INFO' | 'REVENUE' | 'LEAD' | 'SECURITY';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: "1",
      type: 'REVENUE',
      title: "Yield Settlement Successful",
      message: "Engine Alpha-7 completed its daily synthesis. +142.50 USDT settled to wallet.",
      time: "2m ago",
      read: false
    },
    {
      id: "2",
      type: 'LEAD',
      title: "High-Intent Lead Detected",
      message: "New fingerprint sync from SEO_CORE. Intent integrity: 98%. Action required.",
      time: "15m ago",
      read: false
    }
  ],
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: Math.random().toString(36).substring(2, 9),
        time: 'Just now',
        read: false
      },
      ...state.notifications
    ]
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true }))
  })),
  deleteNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
}));
