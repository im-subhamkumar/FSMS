let auditLogs = [];

export const getAuditLogs = async () => {
  return auditLogs;
};

export const createAuditLog = async (logData) => {
  const newLog = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    severity: "info",
    ...logData,
  };

  auditLogs = [newLog, ...auditLogs];

  return newLog;
};

export const clearAuditLogs = async () => {
  auditLogs = [];
};