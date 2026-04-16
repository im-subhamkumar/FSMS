import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserPlus, Search, Edit2, Trash2, HeartPulse, 
  FileBadge, ShieldCheck, ChevronLeft, ChevronRight 
} from "lucide-react";

export default function StudentsRoot() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const perPage = 10;

  const fetchStudents = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/students");
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        console.error("Failed to fetch students. API returned:", data);
        setStudents([]); // Fallback to empty array to prevent .filter crash
      }
    } catch (err) {
      console.error("Network error fetching students:", err);
      setStudents([]); // Fallback to empty array
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete student?")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/students/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Delete failed:", data.error || data);
        let errMsg = data.error || "Delete failed";
        if (errMsg.includes("Foreign key constraint violated")) {
          errMsg = "Cannot delete student due to strict foreign key constraints in the database. Please ensure no active course or flight slot references this student.";
        }
        alert(errMsg);
        return;
      }

      fetchStudents();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Network error: Could not reach the server.");
    }
  };

  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.email} ${s.studentId}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const last = page * perPage;
  const first = last - perPage;
  const current = filtered.slice(first, last);
  const totalPages = Math.ceil(filtered.length / perPage) || 1;

  const today = new Date();

  const medicalExpiring = students.filter(s => {
    if (!s.medicals?.length) return false;
    const date = new Date(s.medicals[0].expiryDate);
    const diff = (date - today) / (1000 * 60 * 60 * 24);
    return diff < 30;
  }).length;

  const licenseExpiring = students.filter(s => {
    if (!s.licenses?.length) return false;
    const date = new Date(s.licenses[0].expiryDate);
    const diff = (date - today) / (1000 * 60 * 60 * 24);
    return diff < 30;
  }).length;

  const activeStudents = students.length;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gray-50/50 dark:bg-slate-900 min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="text-indigo-500" size={32} />
            Students Directory
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 font-medium">
            Manage profiles, licenses, medical records, and documentation
          </p>
        </div>

        <button
          onClick={() => navigate("/students/new")}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 font-semibold"
        >
          <UserPlus size={18} />
          Add Student
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          icon={<Users size={24} className="text-blue-600 dark:text-blue-400" />}
          label="Total Enrolled" 
          value={students.length} 
          bg="bg-blue-50 dark:bg-blue-500/10" 
        />
        <StatCard 
          icon={<HeartPulse size={24} className="text-rose-600 dark:text-rose-400" />}
          label="Medical Expiring" 
          value={medicalExpiring} 
          bg="bg-rose-50 dark:bg-rose-500/10" 
          alert={medicalExpiring > 0}
        />
        <StatCard 
          icon={<FileBadge size={24} className="text-amber-600 dark:text-amber-400" />}
          label="License Expiring" 
          value={licenseExpiring} 
          bg="bg-amber-50 dark:bg-amber-500/10" 
          alert={licenseExpiring > 0}
        />
        <StatCard 
          icon={<ShieldCheck size={24} className="text-emerald-600 dark:text-emerald-400" />}
          label="Active Students" 
          value={activeStudents} 
          bg="bg-emerald-50 dark:bg-emerald-500/10" 
        />
      </div>

      {/* SEARCH AND TABLE CONTAINER */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
        
        {/* SEARCH BAR */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow transition-colors"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Medical</th>
                <th className="px-6 py-4">License</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {current.length > 0 ? current.map((student) => {
                const medical = student.medicals?.[0];
                const license = student.licenses?.[0];

                return (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm shadow-inner">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {student.studentId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 dark:text-slate-200">{student.email}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{student.phone || "No phone"}</div>
                    </td>

                    <td className="px-6 py-4">
                      {medical ? (
                        <StatusBadge status="valid" text="Valid" />
                      ) : (
                        <StatusBadge status="missing" text="Missing" />
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {license ? (
                        <StatusBadge status="active" text="Active" />
                      ) : (
                        <StatusBadge status="missing" text="Missing" />
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/students/edit/${student.id}`); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteStudent(student.id); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <Users size={32} className="text-slate-400" />
                      </div>
                      <p>No students found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-white">{filtered.length > 0 ? first + 1 : 0}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(last, filtered.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{filtered.length}</span> students
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, alert }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700 flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div className={`p-4 rounded-2xl ${alert ? 'bg-rose-100 dark:bg-rose-900/40 animate-pulse' : bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status, text }) {
  const styles = {
    valid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    active: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    missing: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  };

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[status]}`}>
      {text}
    </span>
  );
}