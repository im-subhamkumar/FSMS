const AuditFilters = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-5 flex gap-4 flex-wrap">
      <input
        type="text"
        placeholder="Search logs..."
        className="border rounded-lg px-4 py-2 w-64"
      />

      <select className="border rounded-lg px-4 py-2">
        <option>All Modules</option>
        <option>Students</option>
        <option>Invoices</option>
        <option>Aircraft</option>
      </select>

      <select className="border rounded-lg px-4 py-2">
        <option>All Actions</option>
        <option>CREATE</option>
        <option>UPDATE</option>
        <option>DELETE</option>
      </select>
    </div>
  );
};

export default AuditFilters;