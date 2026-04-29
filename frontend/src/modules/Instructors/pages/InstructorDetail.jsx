import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2, User, Briefcase, Award, Heart,
  PlaneTakeoff, BookOpen, Calendar, FileText, Clock, AlertTriangle,
  Phone, Mail, MapPin, CheckCircle, XCircle, RefreshCw, Loader2,
  Camera, Shield,
} from 'lucide-react';
import { instructorsService } from '../services/instructorsService';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentUpload } from '../components/DocumentUpload';
import { ConfirmModal } from '../components/ConfirmModal';

const DEPT_LABELS = { FLYING: 'Flying', GROUND: 'Ground', SIMULATOR: 'Simulator' };
const DESIG_LABELS = {
  CHIEF_FLIGHT_INSTRUCTOR: 'Chief Flight Instructor',
  SENIOR_FLIGHT_INSTRUCTOR: 'Senior Flight Instructor',
  FLIGHT_INSTRUCTOR: 'Flight Instructor',
  GROUND_INSTRUCTOR: 'Ground Instructor',
  SIMULATOR_INSTRUCTOR: 'Simulator Instructor',
};

const TABS = [
  { id: 'overview',  label: 'Overview',    icon: User },
  { id: 'license',   label: 'License',     icon: Award },
  { id: 'medical',   label: 'Medical',     icon: Heart },
  { id: 'experience',label: 'Experience',  icon: PlaneTakeoff },
  { id: 'ground',    label: 'Ground Quals',icon: BookOpen },
  { id: 'schedule',  label: 'Schedule',    icon: Calendar },
  { id: 'documents', label: 'Documents',   icon: FileText },
  { id: 'log',       label: 'Change Log',  icon: Clock },
];

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 w-44">{label}</span>
      <span className={`text-sm font-medium text-gray-900 dark:text-white text-right ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-gray-300 dark:text-gray-600">—</span>}
      </span>
    </div>
  );
}

function TagList({ items, emptyText = 'None' }) {
  const isArray = Array.isArray(items);
  if (!isArray || items.length === 0) return <span className="text-sm text-gray-400 dark:text-gray-600">{emptyText}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
          {item}
        </span>
      ))}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ExpiryCard({ label, date, status, category }) {
  const bgMap = { 
    VALID: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', 
    EXPIRING_SOON: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', 
    EXPIRED: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
  };
  const Icon = { VALID: CheckCircle, EXPIRING_SOON: AlertTriangle, EXPIRED: XCircle }[status] || CheckCircle;
  const iconColor = { VALID: 'text-emerald-500', EXPIRING_SOON: 'text-amber-500', EXPIRED: 'text-red-500' }[status];
  
  const daysDiff = date ? Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  
  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${bgMap[status] || bgMap.VALID}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-lg font-extrabold text-gray-900 dark:text-white">
            {date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={status} category={category} size="xs" showIcon />
            {daysDiff !== null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/50 border border-current/10 ${iconColor}`}>
                {daysDiff > 0 ? `${daysDiff} Days Left` : `${Math.abs(daysDiff)} Days Overdue`}
              </span>
            )}
          </div>
        </div>
        {daysDiff !== null && daysDiff <= 60 && daysDiff > 0 && (
          <div className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg animate-pulse">
            {daysDiff <= 30 ? 'CRITICAL (30D)' : 'WARNING (60D)'}
          </div>
        )}
      </div>
    </div>
  );
}

function parseJSON(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try { 
    const res = JSON.parse(str);
    return Array.isArray(res) ? res : [res];
  } catch { return []; }
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function InstructorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', action: null, confirmLabel: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await instructorsService.get(id);
      setInstructor(data);
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleUploadDoc = async (file, category, label) => {
    const doc = await instructorsService.uploadDocument(id, file, category, label);
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleDeleteDoc = (docId) => {
    setConfirmModal({
      open: true,
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document?',
      confirmLabel: 'Delete',
      action: async () => {
        await instructorsService.deleteDocument(id, docId);
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    });
  };

  const handleDeactivate = () => {
    setConfirmModal({
      open: true,
      title: 'Deactivate Instructor',
      message: 'Deactivate this instructor? Their record will be preserved.',
      confirmLabel: 'Deactivate',
      action: async () => {
        await instructorsService.remove(id);
        navigate('/instructors');
      }
    });
  };

  const handleConfirm = async () => {
    if (confirmModal.action) {
      await confirmModal.action();
    }
    setConfirmModal({ open: false, title: '', message: '', action: null, confirmLabel: '' });
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-gray-600 dark:text-gray-400">{error || 'Instructor not found'}</p>
        <button onClick={() => navigate('/instructors')} className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">← Back to list</button>
      </div>
    );
  }

  const fullName = `${instructor.user?.firstName} ${instructor.user?.lastName}`;
  const initials = `${instructor.user?.firstName?.[0] || ''}${instructor.user?.lastName?.[0] || ''}`;

  return (
    <div className="space-y-5">
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel || 'Confirm'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal({ open: false, title: '', message: '', action: null, confirmLabel: '' })}
      />
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/instructors')} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Instructors
        </button>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{fullName}</span>
      </div>

      {/* Hero Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>

        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {instructor.profilePhotoUrl
                ? <img src={`http://${window.location.hostname}:3000${instructor.profilePhotoUrl}`} alt={fullName} className="h-20 w-20 rounded-2xl border-4 border-white dark:border-gray-800 object-cover shadow-lg" />
                : <div className="h-20 w-20 rounded-2xl border-4 border-white dark:border-gray-800 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">{initials}</div>
              }
              {instructor.employmentStatus === 'ACTIVE' && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate(`/instructors/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Profile
              </button>
              <button
                onClick={handleDeactivate}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Deactivate
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{DESIG_LABELS[instructor.designation]} · {DEPT_LABELS[instructor.department]}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <StatusBadge status={instructor.employmentStatus} showDot />
                <StatusBadge status={instructor.licenseStatus} category="License" showIcon />
                <StatusBadge status={instructor.medicalStatus} category="Medical" showIcon />
                <StatusBadge status={instructor.flightCurrencyStatus} showIcon />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Mail className="h-3.5 w-3.5" />{instructor.user?.email}
              </span>
              {instructor.phone && (
                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Phone className="h-3.5 w-3.5" />{instructor.phone}
                </span>
              )}
              {instructor.city && (
                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />{instructor.city}{instructor.state ? `, ${instructor.state}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-100 dark:border-gray-700 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    }`}
                >
                  <Icon className="h-4 w-4" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-5">
                <SectionCard title="Personal Information" icon={User}>
                  <InfoRow label="Full Name" value={fullName} />
                  <InfoRow label="Date of Birth" value={formatDate(instructor.dateOfBirth)} />
                  <InfoRow label="Gender" value={instructor.gender} />
                  <InfoRow label="Nationality" value={instructor.nationality} />
                  <InfoRow label="Phone" value={instructor.phone} />
                  <InfoRow label="Emergency Phone" value={instructor.emergencyPhone} />
                  <InfoRow label="Address" value={[instructor.address, instructor.city, instructor.state, instructor.pinCode].filter(Boolean).join(', ')} />
                </SectionCard>
              </div>
              <div className="space-y-5">
                <SectionCard title="Employment Details" icon={Briefcase}>
                  <InfoRow label="Employee ID" value={instructor.employeeId} mono />
                  <InfoRow label="Designation" value={DESIG_LABELS[instructor.designation]} />
                  <InfoRow label="Department" value={DEPT_LABELS[instructor.department]} />
                  <InfoRow label="Date of Joining" value={formatDate(instructor.dateOfJoining)} />
                  <InfoRow label="Employment Type" value={instructor.employmentType?.replace('_', ' ')} />
                  <InfoRow label="Status" value={<StatusBadge status={instructor.employmentStatus} showDot />} />
                  {instructor.reportingTo && (
                    <InfoRow label="Reports To" value={`${instructor.reportingTo.user?.firstName} ${instructor.reportingTo.user?.lastName}`} />
                  )}
                </SectionCard>
              </div>
            </div>
          )}

          {/* LICENSE TAB */}
          {activeTab === 'license' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ExpiryCard label="License Expiry" date={instructor.licenseExpiryDate} status={instructor.licenseStatus} category="License" />
                <ExpiryCard label="Flight Currency" date={instructor.lastFlightDate} status={instructor.flightCurrencyStatus} category="Currency" />
              </div>
              <SectionCard title="License Details" icon={Award}>
                <InfoRow label="License Number" value={instructor.licenseNumber} mono />
                <InfoRow label="License Types" value={<TagList items={parseJSON(instructor.licenseTypes)} />} />
                <InfoRow label="Issuing Authority" value={instructor.issuingAuthority} />
                <InfoRow label="Issue Date" value={formatDate(instructor.licenseIssueDate)} />
                <InfoRow label="Expiry Date" value={formatDate(instructor.licenseExpiryDate)} />
              </SectionCard>
              <SectionCard title="Ratings & Type Ratings" icon={Shield}>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Ratings</p>
                    <TagList items={parseJSON(instructor.ratings)} emptyText="No ratings recorded" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Aircraft Type Ratings</p>
                    <TagList items={parseJSON(instructor.typeRatings)} emptyText="No type ratings recorded" />
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* MEDICAL TAB */}
          {activeTab === 'medical' && (
            <div className="space-y-5">
              <ExpiryCard label="Medical Certificate Expiry" date={instructor.medicalExpiryDate} status={instructor.medicalStatus} category="Medical" />
              {instructor.medicalStatus === 'EXPIRED' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">Medical Certificate Expired</p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">This instructor is blocked from all flight and simulator assignments until medical is renewed.</p>
                  </div>
                </div>
              )}
              <SectionCard title="Medical Certificate Details" icon={Heart}>
                <InfoRow label="Medical Class" value={instructor.medicalClass} />
                <InfoRow label="Certificate Number" value={instructor.medicalCertNumber} mono />
                <InfoRow label="Issuing AME" value={instructor.medicalIssuingAME} />
                <InfoRow label="Issue Date" value={formatDate(instructor.medicalIssueDate)} />
                <InfoRow label="Expiry Date" value={formatDate(instructor.medicalExpiryDate)} />
              </SectionCard>
            </div>
          )}

          {/* EXPERIENCE TAB */}
          {activeTab === 'experience' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total Hours', value: instructor.totalHours },
                  { label: 'PIC Hours', value: instructor.picHours },
                  { label: 'Dual (Instructor)', value: instructor.dualHours },
                  { label: 'Simulator Hours', value: instructor.simHours },
                  { label: 'Night Hours', value: instructor.nightHours },
                  { label: 'Instrument Hours', value: instructor.instrumentHours },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{value ?? 0}<span className="text-sm font-medium text-gray-400 ml-1">hrs</span></p>
                  </div>
                ))}
              </div>
              <SectionCard title="Aircraft Flown" icon={PlaneTakeoff}>
                <TagList items={parseJSON(instructor.aircraftFlown)} emptyText="No aircraft recorded" />
              </SectionCard>
              <SectionCard title="Currency" icon={Calendar}>
                <InfoRow label="Last Flight Date" value={formatDate(instructor.lastFlightDate)} />
                <InfoRow label="Currency Status" value={<StatusBadge status={instructor.flightCurrencyStatus} showIcon />} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Flight currency expires if no flight in 90 days (75 days = warning).</p>
              </SectionCard>
            </div>
          )}

          {/* GROUND QUALS TAB */}
          {activeTab === 'ground' && (
            <div className="space-y-5">
              <SectionCard title="Ground School Qualifications" icon={BookOpen}>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Subjects Qualified to Teach</p>
                    <TagList items={parseJSON(instructor.subjectsCanTeach)} emptyText="None specified" />
                  </div>
                  <InfoRow label="FIS Standardization Date" value={formatDate(instructor.fisDate)} />
                </div>
              </SectionCard>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="space-y-5">
              <SectionCard title="Work Schedule" icon={Calendar}>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Working Days</p>
                  <div className="flex flex-wrap gap-2">
                    {['MON','TUE','WED','THU','FRI','SAT','SUN'].map((day) => {
                      const workDays = parseJSON(instructor.workDays);
                      const active = workDays.includes(day);
                      return (
                        <span key={day} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>{day}</span>
                      );
                    })}
                  </div>
                </div>
                <InfoRow label="Preferred Start" value={instructor.preferredStartTime || '—'} />
                <InfoRow label="Preferred End" value={instructor.preferredEndTime || '—'} />
                <InfoRow label="Max Flight Hrs/Day" value={instructor.maxFlightHrsDay ? `${instructor.maxFlightHrsDay} hrs` : '8 hrs'} />
                <InfoRow label="Max Dual Hrs/Month" value={instructor.maxDualHrsMonth ? `${instructor.maxDualHrsMonth} hrs` : '100 hrs'} />
              </SectionCard>
              <SectionCard title="Capabilities" icon={CheckCircle}>
                {[
                  { label: 'Simulator sessions', value: instructor.canDoSim },
                  { label: 'Ground school sessions', value: instructor.canDoGround },
                  { label: 'Night flying', value: instructor.canDoNight },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                    {value
                      ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                      : <XCircle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                    }
                  </div>
                ))}
              </SectionCard>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <DocumentUpload
              documents={documents}
              onUpload={handleUploadDoc}
              onDelete={handleDeleteDoc}
              isLoading={docsLoading}
            />
          )}

          {/* CHANGE LOG TAB */}
          {activeTab === 'log' && (
            <div className="space-y-3">
              {(instructor.changeLogs || []).length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">No changes recorded yet.</p>
              ) : (
                instructor.changeLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 items-start p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">{log.fieldChanged}</span> changed
                        {log.oldValue ? <> from <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">{log.oldValue}</code></> : ''}
                        {' '}to <code className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1 rounded">{log.newValue}</code>
                      </p>
                      {log.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{log.note}</p>}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(log.changedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
