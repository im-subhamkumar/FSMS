import AuditTable from "../components/AuditTable";

import EventSimulator from "../../Notifications/components/EventSimulator";

const AuditLogsPage = () => {

  const exportCSV = () => {
    const logs =
      JSON.parse(localStorage.getItem("auditLogs")) || [];

    const headers = [
      "Module",
      "Action",
      "User",
      "Severity",
      "Details",
      "Timestamp",
    ];

    const rows = logs.map((log) => [
      log.module,
      log.action,
      log.user,
      log.severity,
      log.details,
      log.timestamp,
    ]);

    let csvContent =
      headers.join(",") + "\n";

    rows.forEach((row) => {
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], {
      type: "text/csv",
    });

    const url =
      window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "audit_logs.csv";

    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">

      <div className="flex items-center justify-between mb-6">

        <h1 className="text-2xl font-bold">
          Audit Logs
        </h1>

        <button
          onClick={exportCSV}
          className="
            bg-blue-600
            text-white
            px-4
            py-2
            rounded-lg
            hover:bg-blue-700
          "
        >
          Export Logs
        </button>

      </div>

      <EventSimulator />

      <AuditTable />

    </div>
  );
};

export default AuditLogsPage;