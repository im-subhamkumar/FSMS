import React from "react";

const StatusBadge = ({ status }) => {
  let colorClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"; // default

  switch (status) {
    case "Active":
      colorClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400";
      break;
    case "In Maintenance":
      colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
      break;
    case "Inactive":
      colorClass = "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400";
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
