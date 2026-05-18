import { createContext, useEffect, useState } from "react";
import {
  createAuditLog,
  getAuditLogs,
} from "../../../services/auditService";

export const AuditContext = createContext();

export const AuditProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const data = await getAuditLogs();

      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  const addAuditLog = async (logData) => {
    const newLog = await createAuditLog(logData);

    setLogs((prev) => [newLog, ...prev]);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <AuditContext.Provider
      value={{
        logs,
        loading,
        addAuditLog,
        fetchLogs,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};