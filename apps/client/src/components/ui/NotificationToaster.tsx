import { useEffect } from "react";
import {
  type AppNotification,
  useNotificationStore,
} from "@/store/notificationStore";

const notificationIcon: Record<AppNotification["variant"], string> = {
  success: "✓",
  error: "×",
  danger: "×",
  info: "i",
};

function NotificationToast({ notification }: { notification: AppNotification }) {
  const dismiss = useNotificationStore((state) => state.dismiss);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dismiss(notification.id);
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dismiss, notification.id]);

  return (
    <div className={`notification-toast notification-toast--${notification.variant}`}>
      <span className="notification-toast__icon" aria-hidden>
        {notificationIcon[notification.variant]}
      </span>
      <span className="notification-toast__message">{notification.message}</span>
      <button
        type="button"
        className="notification-toast__close"
        onClick={() => dismiss(notification.id)}
        aria-label="Bildirişi bağla"
      >
        ×
      </button>
    </div>
  );
}

export function NotificationToaster() {
  const notifications = useNotificationStore((state) => state.notifications);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-stack" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
