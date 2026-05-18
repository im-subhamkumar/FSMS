const NotificationCard = ({
  notification,
  onRead,
}) => {
  const getBgColor = () => {
    switch (notification.severity) {
      case "error":
        return "bg-red-50 border-red-200";

      case "warning":
        return "bg-yellow-50 border-yellow-200";

      case "success":
        return "bg-green-50 border-green-200";

      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div
      onClick={() => onRead(notification.id)}
      className={`
        p-4 rounded-xl border cursor-pointer transition-all
        ${getBgColor()}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-sm">
            {notification.title}
          </h4>

          <p className="text-sm text-gray-700 mt-1">
            {notification.message}
          </p>

          <span className="text-xs text-gray-500 mt-2 block">
            {notification.timestamp}
          </span>
        </div>

        {!notification.isRead && (
          <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
        )}
      </div>
    </div>
  );
};

export default NotificationCard;