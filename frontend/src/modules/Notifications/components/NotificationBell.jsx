import { Bell } from "lucide-react";
import { useState } from "react";

import NotificationDropdown from "./NotificationDropdown";

import { useNotifications } from "../hooks/useNotifications";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    clearAllNotifications,
  } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="w-6 h-6" />

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -top-2
              -right-2
              bg-red-500
              text-white
              text-xs
              rounded-full
              w-5
              h-5
              flex
              items-center
              justify-center
            "
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          onRead={markAsRead}
          onMarkAllRead={markAllRead}
          onClearAll={clearAllNotifications}
        />
      )}
    </div>
  );
};

export default NotificationBell;