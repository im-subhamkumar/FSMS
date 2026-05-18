import {
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const NotificationContext =
  createContext(null);

export const NotificationProvider = ({
  children,
}) => {
  const [notifications, setNotifications] =
    useState([]);

  const loadNotifications = () => {
    const stored =
      JSON.parse(
        localStorage.getItem("notifications")
      ) || [];

    setNotifications(stored);
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (item) => !item.isRead
    ).length;
  }, [notifications]);

  const markAsRead = (id) => {
    const updated = notifications.map((item) =>
      item.id === id
        ? { ...item, isRead: true }
        : item
    );

    setNotifications(updated);

    localStorage.setItem(
      "notifications",
      JSON.stringify(updated)
    );
  };

  const markAllRead = () => {
    const updated = notifications.map((item) => ({
      ...item,
      isRead: true,
    }));

    setNotifications(updated);

    localStorage.setItem(
      "notifications",
      JSON.stringify(updated)
    );
  };

  const clearAllNotifications = () => {
    localStorage.removeItem("notifications");

    setNotifications([]);
  };

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener(
      "notificationsUpdated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "notificationsUpdated",
        handleUpdate
      );
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};