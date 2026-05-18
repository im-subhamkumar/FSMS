import NotificationList from "./NotificationList";

const NotificationDropdown = ({
  notifications,
  onRead,
  onMarkAllRead,
  onClearAll,
}) => {
  return (
    <div
      className="
        absolute right-0 mt-3
        w-[420px]
        bg-white
        rounded-2xl
        shadow-2xl
        border
        z-50
        p-4
      "
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">
          Notifications
        </h3>

        <div className="flex gap-2">
          <button
            onClick={onMarkAllRead}
            className="text-sm text-blue-600 font-medium"
          >
            Mark all read
          </button>

          <button
            onClick={onClearAll}
            className="text-sm text-red-500 font-medium"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        <NotificationList
          notifications={notifications}
          onRead={onRead}
        />
      </div>
    </div>
  );
};

export default NotificationDropdown;