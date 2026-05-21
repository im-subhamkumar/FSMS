import React from 'react';
import { FileWarning, ShieldAlert, ShieldOff, Clock, AlertTriangle } from 'lucide-react';

const urgencyColor = (days) => {
  if (days <= 7) return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' };
  if (days <= 30) return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' };
  return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' };
};

const statusBadge = (status) => {
  const map = {
    EXPIRED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: ShieldOff },
    EXPIRING_SOON: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: ShieldAlert },
  };
  return map[status] || map.EXPIRING_SOON;
};

export default function CompliancePanel({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
            {[1, 2, 3].map(j => <div key={j} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse mb-3" />)}
          </div>
        ))}
      </div>
    );
  }

  const docs = data?.expiringDocuments || [];
  const licAlerts = data?.instructorLicenseAlerts || [];
  const medAlerts = data?.instructorMedicalAlerts || [];
  const totalAlerts = data?.totalAlerts || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Expiring Documents */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Expiring Documents</h3>
          {totalAlerts > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">
              <AlertTriangle size={12} /> {totalAlerts} alerts
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {data?.expiredDocumentCount || 0} expired · {docs.length} expiring within 60 days
        </p>

        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {docs.length > 0 ? docs.map((doc, i) => {
            const colors = urgencyColor(doc.daysRemaining);
            return (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${colors.border} ${colors.bg}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <FileWarning size={16} className={colors.text} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{doc.category?.name || 'General'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className={`text-xs font-bold ${colors.text}`}>{doc.daysRemaining}d left</p>
                  <p className="text-[10px] text-gray-400">{new Date(doc.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8 text-gray-400">
              <Clock size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents expiring soon</p>
            </div>
          )}
        </div>
      </div>

      {/* License & Medical Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">License & Medical Alerts</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Instructor compliance issues</p>

        {(licAlerts.length > 0 || medAlerts.length > 0) ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {licAlerts.map((a, i) => {
              const badge = statusBadge(a.status);
              const BadgeIcon = badge.icon;
              return (
                <div key={`lic-${i}`} className={`flex items-center justify-between p-3 rounded-xl ${badge.bg}`}>
                  <div className="flex items-center gap-3">
                    <BadgeIcon size={16} className={badge.text} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">License · {a.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {a.expiryDate && <p className="text-xs text-gray-500">{new Date(a.expiryDate).toLocaleDateString()}</p>}
                </div>
              );
            })}
            {medAlerts.map((a, i) => {
              const badge = statusBadge(a.status);
              const BadgeIcon = badge.icon;
              return (
                <div key={`med-${i}`} className={`flex items-center justify-between p-3 rounded-xl ${badge.bg}`}>
                  <div className="flex items-center gap-3">
                    <BadgeIcon size={16} className={badge.text} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Medical · {a.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {a.expiryDate && <p className="text-xs text-gray-500">{new Date(a.expiryDate).toLocaleDateString()}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <ShieldAlert size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">All licenses and medicals are valid</p>
          </div>
        )}
      </div>
    </div>
  );
}
