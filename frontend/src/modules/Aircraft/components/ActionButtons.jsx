import React from "react";
import { Eye, Edit2, Trash2 } from "lucide-react";

const ActionButtons = ({ onView, onEdit, onDelete }) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onView}
        title="View Details"
        className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
      >
        <Eye size={18} />
      </button>
      <button
        onClick={onEdit}
        title="Edit"
        className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
      >
        <Edit2 size={18} />
      </button>
      <button
        onClick={onDelete}
        title="Delete"
        className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default ActionButtons;
