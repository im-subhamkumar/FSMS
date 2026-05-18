const AuditRow = ({ log }) => {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4 font-medium">
        {log.module}
      </td>

      <td className="p-4">
        <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
          {log.action}
        </span>
      </td>

      <td className="p-4">
        {log.user}
      </td>

      <td className="p-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold
            ${
              log.severity === "error"
                ? "bg-red-100 text-red-600"
                : log.severity === "warning"
                ? "bg-yellow-100 text-yellow-700"
                : log.severity === "success"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
        >
          {log.severity || "info"}
        </span>
      </td>

      <td className="p-4 text-gray-700">
        {log.details}
      </td>

      <td className="p-4 text-gray-500">
        {log.timestamp}
      </td>
    </tr>
  );
};

export default AuditRow;