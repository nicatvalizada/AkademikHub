import { create } from "zustand";

export type NotificationVariant = "success" | "error" | "danger" | "info";

export type AppNotification = {
  id: string;
  message: string;
  variant: NotificationVariant;
};

type NotificationState = {
  notifications: AppNotification[];
  notify: (message: string, variant?: NotificationVariant) => string;
  dismiss: (id: string) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  notify: (message, variant = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({
      notifications: [...state.notifications, { id, message, variant }],
    }));
    return id;
  },
  dismiss: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    }));
  },
}));
