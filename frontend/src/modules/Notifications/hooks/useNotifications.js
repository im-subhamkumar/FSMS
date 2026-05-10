import { useEffect, useState } from "react";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = () => {
    const stored =
      JSON.parse(localStorage.getItem("notifications")) || [];

    setNotifications(stored);
  };

  useEffect(() => {
    loadNotifications();

    window.addEventListener(
      "notificationsUpdated",
      loadNotifications
    );

    return () => {
      window.removeEventListener(
        "notificationsUpdated",
        loadNotifications
      );
    };
  }, []);

  return {
    notifications,
  };
};