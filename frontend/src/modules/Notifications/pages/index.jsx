import NotificationBell from "../components/NotificationBell";
import NotificationList from "../components/NotificationList";
import EventSimulator from "../components/EventSimulator";

const NotificationsPage = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Notifications
        </h1>

        <NotificationBell />
      </div>

      <EventSimulator />

      <NotificationList />
    </div>
  );
};

export default NotificationsPage;