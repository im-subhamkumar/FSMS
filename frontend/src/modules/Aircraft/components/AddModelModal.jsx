import React, { useState } from "react";

const AddModelModal = ({ onClose, onAdd }) => {
  const [model, setModel] = useState("");

  const handleAdd = () => {
    if (!model.trim()) {
      alert("Enter model name");
      return;
    }
    onAdd(model.trim());
    setModel("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60]">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-96 max-w-[90vw] shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Add Model
        </h2>

        <input
          type="text"
          placeholder="Enter model name (e.g. C172)"
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 mb-4 focus:outline-none focus:border-blue-500 transition-colors"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          autoFocus
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddModelModal;