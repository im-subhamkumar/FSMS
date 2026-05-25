import { createContext, useState } from "react";
import {
  createAuditLog,
} from "../../../services/auditService";

export const AuditContext = createContext();

export const AuditProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [loading] = useState(false);

  const addAuditLog = async (logData) => {
    try {
      const newLog = await createAuditLog(logData);

      setLogs((prev) => [newLog, ...prev]);
    } catch (error) {
      console.error("Failed to create audit log", error);
    }
  };

  return (
    <AuditContext.Provider
      value={{
        logs,
        loading,
        addAuditLog,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};