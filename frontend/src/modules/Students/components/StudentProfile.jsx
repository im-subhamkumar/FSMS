import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Edit2, User, ShieldCheck, HeartPulse,
  Lock, FileText, MapPin, Phone, Mail, Calendar,
  Globe, CreditCard, BookOpen, ExternalLink, Badge
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [id, fetchStudent]);

  const fetchStudent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`);
      const data = await res.json();
      setStudent(data);
    } catch (err) {
      console.error("Failed to load student:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Student not found.</p>
      </div>
    );
  }

  const license = student.licenses?.[0];
  const medical = student.medicals?.[0];
  const account = student.account;
  const documents = student.documents || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const expiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 30;
  };

  const DateBadge = ({ date }) => {
    if (!date) return <span className="text-slate-400">—</span>;
    if (isExpired(date)) return <span className="text-rose-600 font-semibold">{formatDate(date)} · Expired</span>;
    if (expiringSoon(date)) return <span className="text-amber-600 font-semibold">{formatDate(date)} · Expiring Soon</span>;
    return <span className="text-slate-800 dark:text-slate-200">{formatDate(date)}</span>;
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto min-h-full">

      {/* BACK + HEADER */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/students")}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Directory
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/30">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-mono text-sm mt-1">{student.studentId}</p>
              <div className="flex items-center gap-2 mt-2">
                {license
                  ? <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">License Active</span>
                  : <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">No License</span>
                }
                {medical
                  ? <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Medical Valid</span>
                  : <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">No Medical</span>
                }
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/students/edit/${student.id}`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PERSONAL INFO */}
        <SectionCard icon={<User size={20} className="text-indigo-500" />} title="Personal Information">
          <InfoRow icon={<Mail size={15} />} label="Personal Email" value={student.email} />
          <InfoRow icon={<Calendar size={15} />} label="Date of Birth" value={formatDate(student.dob)} />
          <InfoRow icon={<Badge size={15} />} label="Gender" value={student.gender} />
          <InfoRow icon={<Globe size={15} />} label="Nationality" value={student.nationality} />
          <InfoRow icon={<Phone size={15} />} label="Phone" value={student.phone} />
        </SectionCard>

        {/* ADDRESS */}
        <SectionCard icon={<MapPin size={20} className="text-rose-500" />} title="Address">
          <InfoRow label="Address" value={student.address} full />
          <InfoRow label="City" value={student.city} />
          <InfoRow label="State / Province" value={student.state} />
          <InfoRow label="Pincode / ZIP" value={student.pincode} />
        </SectionCard>

        {/* LICENSE */}
        <SectionCard icon={<ShieldCheck size={20} className="text-blue-500" />} title="Aviation License">
          {license ? (
            <>
              <InfoRow icon={<CreditCard size={15} />} label="License Number" value={license.licenseNumber} />
              <InfoRow icon={<BookOpen size={15} />} label="License Type" value={license.licenseType} />
              <InfoRow icon={<Calendar size={15} />} label="Issue Date" value={formatDate(license.issueDate)} />
              <div className="grid grid-cols-[1fr_auto_2fr] gap-x-3 items-start py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">Expiry Date</span>
                <span className="text-slate-200 dark:text-slate-600">·</span>
                <DateBadge date={license.expiryDate} />
              </div>
            </>
          ) : (
            <EmptySection text="No license on record" />
          )}
        </SectionCard>

        {/* MEDICAL */}
        <SectionCard icon={<HeartPulse size={20} className="text-emerald-500" />} title="Medical Certificate">
          {medical ? (
            <>
              <InfoRow icon={<CreditCard size={15} />} label="Certificate No." value={medical.medicalCertificateNumber} />
              <InfoRow icon={<Calendar size={15} />} label="Issue Date" value={formatDate(medical.issueDate)} />
              <div className="grid grid-cols-[1fr_auto_2fr] gap-x-3 items-start py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">Valid Until</span>
                <span className="text-slate-200 dark:text-slate-600">·</span>
                <DateBadge date={medical.expiryDate} />
              </div>
            </>
          ) : (
            <EmptySection text="No medical certificate on record" />
          )}
        </SectionCard>

        {/* ACCOUNT */}
        <SectionCard icon={<Lock size={20} className="text-amber-500" />} title="School Account">
          {account ? (
            <InfoRow icon={<Mail size={15} />} label="School Email" value={account.schoolEmail} />
          ) : (
            <EmptySection text="No school account created" />
          )}
        </SectionCard>

        {/* DOCUMENTS */}
        <SectionCard icon={<FileText size={20} className="text-purple-500" />} title={`Documents (${documents.length})`}>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.documentType || "Unnamed Document"}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{doc.fileUrl || "No URL"}</p>
                  </div>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors flex-shrink-0"
                      title="Open Document"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptySection text="No documents attached" />
          )}
        </SectionCard>

      </div>
    </div>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        {icon}
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h3>
      </div>
      <div className="px-6 py-5 divide-y divide-slate-50 dark:divide-slate-700/50">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, full }) {
  return (
    <div className={`${full ? 'flex flex-col gap-1' : 'grid grid-cols-[1fr_auto_2fr] gap-x-3 items-start'} py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">
        {icon && <span className="text-slate-300 dark:text-slate-600">{icon}</span>}
        {label}
      </div>
      {!full && <span className="text-slate-200 dark:text-slate-600">·</span>}
      <span className="text-sm text-slate-800 dark:text-slate-200 break-words">{value || "—"}</span>
    </div>
  );
}

function EmptySection({ text }) {
  return (
    <div className="py-4 text-center text-sm text-slate-400 italic">{text}</div>
  );
}
