import { useEffect, useState } from "react";

export const useAuditLogs = () => {
  const [logs, setLogs] = useState([]);

  const loadLogs = () => {
    const stored =
      JSON.parse(localStorage.getItem("auditLogs")) || [];

    setLogs(stored);
  };

  useEffect(() => {
    loadLogs();

    window.addEventListener(
      "auditLogsUpdated",
      loadLogs
    );

    return () => {
      window.removeEventListener(
        "auditLogsUpdated",
        loadLogs
      );
    };
  }, []);

  return {
    logs,
  };
};