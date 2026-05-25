import { useState } from "react";

import AuditRow from "./AuditRow";
import { useAuditLogs } from "../hooks/useAuditLogs";

const AuditTable = () => {
  const [search, setSearch] = useState("");

  const { logs } = useAuditLogs();

  const filteredLogs = logs.filter((log) =>
    log.module
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (filteredLogs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
        No audit logs available
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by module..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="
            border
            rounded-lg
            px-4
            py-2
            w-full
          "
        />
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">
                Module
              </th>

              <th className="text-left p-4">
                Action
              </th>

              <th className="text-left p-4">
                User
              </th>

              <th className="text-left p-4">
                Severity
              </th>

              <th className="text-left p-4">
                Details
              </th>

              <th className="text-left p-4">
                Timestamp
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.map((log) => (
              <AuditRow
                key={log.id}
                log={log}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTable;