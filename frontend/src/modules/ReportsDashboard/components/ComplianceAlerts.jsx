// ComplianceAlerts.jsx -- Scrollable list of expiring/expired compliance items.
// Shows licenses, medicals, and documents expiring within 30 days or already
// expired. Each alert displays entity name, detail, type badge (colour-coded),
// and expiry date. Header shows aggregate expired/expiring counts.
// Data source: GET /api/reports/compliance
import React from 'react';
import { ShieldAlert, AlertTriangle, Clock } from 'lucide-react';

export default function ComplianceAlerts({ data }) {
  const alerts = data?.alerts || [];
  const expiredCount = data?.expiredCount || 0;
  const expiringSoonCount = data?.expiringSoonCount || 0;

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[280px]">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-full mb-3">
          <ShieldAlert className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Compliance Status</h3>
        <p className="text-emerald-500 text-xs mt-1 font-medium">All clear — no expiring items</p>
      </div>
    );
  }

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const typeColors = {
    License: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700',
    Medical: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700',
    Document: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[280px]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-gray-800 dark:text-gray-100 font-semibold text-sm">Compliance Alerts</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Licenses, medicals & documents expiring within 30 days</p>
        </div>
        <div className="flex items-center gap-2">
          {expiredCount > 0 && (
            <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-red-200 dark:border-red-700">
              {expiredCount} Expired
            </span>
          )}
          {expiringSoonCount > 0 && (
            <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-amber-200 dark:border-amber-700">
              {expiringSoonCount} Expiring
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[240px] pr-1 custom-scrollbar">
        {alerts.map((alert, idx) => (
          <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
            alert.status === 'EXPIRED'
              ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/40'
              : 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/40'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                alert.status === 'EXPIRED' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                {alert.status === 'EXPIRED'
                  ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  : <Clock className="w-3.5 h-3.5 text-amber-500" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{alert.entity}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{alert.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${typeColors[alert.type] || typeColors.Document}`}>
                {alert.type}
              </span>
              <span className={`text-[10px] font-semibold ${
                alert.status === 'EXPIRED' ? 'text-red-500' : 'text-amber-500'
              }`}>
                {formatDate(alert.expiryDate)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
