import NotificationCard from "./NotificationCard";

const NotificationList = ({
  notifications = [],
  onRead,
}) => {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        Click on the Bell icon to check notifications
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRead={onRead}
        />
      ))}
    </div>
  );
};

export default NotificationList;