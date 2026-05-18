export const dispatchSystemEvent = ({
  module,
  action,
  message,
  user,
  severity = "info",
  notificationType = "info",
}) => {
  // Notification object
  const notification = {
    id: Date.now(),
    module,
    title: `${module} ${action}`,
    message,
    type: notificationType,
    severity,
    isRead: false,
    timestamp: new Date().toLocaleString(),
  };

  // Existing notifications
  const existingNotifications =
    JSON.parse(localStorage.getItem("notifications")) || [];

  existingNotifications.unshift(notification);

  localStorage.setItem(
    "notifications",
    JSON.stringify(existingNotifications)
  );

  // Audit log object
  const auditLog = {
    id: Date.now(),
    module,
    action,
    user,
    severity,
    details: message,
    timestamp: new Date().toLocaleString(),
  };

  // Existing audit logs
  const existingLogs =
    JSON.parse(localStorage.getItem("auditLogs")) || [];

  existingLogs.unshift(auditLog);

  localStorage.setItem(
    "auditLogs",
    JSON.stringify(existingLogs)
  );

  // Real-time updates
  window.dispatchEvent(
    new Event("notificationsUpdated")
  );

  window.dispatchEvent(
    new Event("auditLogsUpdated")
  );
};