import { dispatchSystemEvent } from "../../../services/notificationService";

const EventSimulator = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">
        Simulate System Events
      </h2>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() =>
            dispatchSystemEvent({
              module: "Invoices",
              action: "OVERDUE",
              message: "Invoice INV-2026-001 overdue",
              user: "System",
              severity: "warning",
              notificationType: "warning",
            })
          }
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Invoice Alert
        </button>

        <button
          onClick={() =>
            dispatchSystemEvent({
              module: "Weather Holds",
              action: "NO_GO",
              message: "Unsafe flying conditions detected",
              user: "System",
              severity: "error",
              notificationType: "error",
            })
          }
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
        >
          Weather Alert
        </button>

        <button
          onClick={() =>
            dispatchSystemEvent({
              module: "Slot Requests",
              action: "APPROVE",
              message: "Slot request approved",
              user: "Instructor",
              severity: "success",
              notificationType: "success",
            })
          }
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          Slot Approved
        </button>

        <button
          onClick={() =>
            dispatchSystemEvent({
              module: "Documents",
              action: "UPLOAD",
              message: "Medical document uploaded",
              user: "Student",
              severity: "info",
              notificationType: "info",
            })
          }
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Upload Document
        </button>
      </div>
    </div>
  );
};

export default EventSimulator;