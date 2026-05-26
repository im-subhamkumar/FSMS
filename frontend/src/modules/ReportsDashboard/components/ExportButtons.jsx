// ExportButtons.jsx -- CSV and PDF export for the Reports Dashboard.
// CSV export: Generates a multi-section CSV file from the unified data object.
// PDF export: Uses jsPDF to create a formatted PDF with KPIs, tables, and
// footer text. Both formats include financial, student, and flight data.
import React from 'react';
import jsPDF from 'jspdf';
import { FileSpreadsheet, FileText } from 'lucide-react';

export default function ExportButtons({ dateRange, data }) {
  const exportCSV = () => {
    if (!data || !data.financial) return;

    const csvRows = [];
    csvRows.push(['FSMS Report Dashboard — CSV Export']);
    csvRows.push(['Report Start', dateRange.from || 'All Time']);
    csvRows.push(['Report End', dateRange.to || 'Present']);
    csvRows.push(['Generated', new Date().toLocaleString()]);
    csvRows.push([]);

    // Financial
    csvRows.push(['--- Financial Summary ---']);
    csvRows.push(['Total Revenue (Paid)', data.financial.totalRevenue || 0]);
    csvRows.push(['Total Billed', data.financial.totalBilled || 0]);
    csvRows.push(['Pending Amount', data.financial.pendingAmount || 0]);
    csvRows.push(['Overdue Amount', data.financial.overdueAmount || 0]);
    csvRows.push(['Overdue Invoices', data.financial.overdueCount || 0]);
    csvRows.push(['Collection Rate', `${data.financial.collectionRate || 0}%`]);
    csvRows.push([]);

    // Operations
    csvRows.push(['--- Operations Summary ---']);
    csvRows.push(['Active Students', data.students?.activeStudents || 0]);
    csvRows.push(['Total Flight Hours', data.flights?.totalFlyingHours || 0]);
    csvRows.push(['Total Flight Slots', data.flights?.totalSlots || 0]);
    csvRows.push(['Completed Slots', data.flights?.completedSlots || 0]);
    csvRows.push(['Cancelled Slots', data.flights?.cancelledSlots || 0]);
    csvRows.push(['Slot Utilization', `${data.flights?.utilizationRate || 0}%`]);
    csvRows.push([]);

    // Staff & Courses
    csvRows.push(['--- Academy & Staff ---']);
    csvRows.push(['Active Instructors', data.instructors?.activeInstructors || 0]);
    csvRows.push(['Total Courses', data.courses?.totalCourses || 0]);
    csvRows.push([]);

    // Fleet
    if (data.fleet) {
      csvRows.push(['--- Fleet Status ---']);
      csvRows.push(['Total Aircraft', data.fleet.totalAircraft || 0]);
      csvRows.push(['Open Squawks', data.fleet.openSquawks || 0]);
      (data.fleet.statusDistribution || []).forEach(s => {
        csvRows.push([s.name, s.value]);
      });
      csvRows.push([]);
    }

    // Compliance
    if (data.compliance) {
      csvRows.push(['--- Compliance Alerts ---']);
      csvRows.push(['Expired Items', data.compliance.expiredCount || 0]);
      csvRows.push(['Expiring Soon', data.compliance.expiringSoonCount || 0]);
      (data.compliance.alerts || []).forEach(a => {
        csvRows.push([a.type, a.entity, a.detail, a.status, new Date(a.expiryDate).toLocaleDateString()]);
      });
    }

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FSMS_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data || !data.financial) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('FSMS Report Dashboard', 15, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Period: ${dateRange.from || 'Start'} to ${dateRange.to || 'End'}`, 15, yPos);
    yPos += 15;

    // Section helper
    const drawSection = (title, metrics) => {
      if (yPos > 260) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(title, 15, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      metrics.forEach(m => {
        doc.text(m.label, 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(String(m.value), 120, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 7;
      });
      yPos += 8;
    };

    drawSection('Financial Metrics', [
      { label: 'Total Revenue (Paid):', value: `INR ${(data.financial.totalRevenue || 0).toLocaleString()}` },
      { label: 'Total Billed:', value: `INR ${(data.financial.totalBilled || 0).toLocaleString()}` },
      { label: 'Outstanding Pending:', value: `INR ${(data.financial.pendingAmount || 0).toLocaleString()}` },
      { label: 'Overdue Amount:', value: `INR ${(data.financial.overdueAmount || 0).toLocaleString()}` },
      { label: 'Collection Rate:', value: `${data.financial.collectionRate || 0}%` },
    ]);

    drawSection('Operational Metrics', [
      { label: 'Active Students:', value: data.students?.activeStudents || 0 },
      { label: 'Total Flight Hours:', value: `${data.flights?.totalFlyingHours || 0} hrs` },
      { label: 'Completed / Total Slots:', value: `${data.flights?.completedSlots || 0} / ${data.flights?.totalSlots || 0}` },
      { label: 'Slot Utilization:', value: `${data.flights?.utilizationRate || 0}%` },
    ]);

    drawSection('Academy & Staff', [
      { label: 'Active Instructors:', value: data.instructors?.activeInstructors || 0 },
      { label: 'Total Courses:', value: data.courses?.totalCourses || 0 },
    ]);

    if (data.fleet) {
      drawSection('Fleet Status', [
        { label: 'Total Aircraft:', value: data.fleet.totalAircraft || 0 },
        { label: 'Open Squawks:', value: data.fleet.openSquawks || 0 },
        ...(data.fleet.statusDistribution || []).map(s => ({ label: `${s.name}:`, value: s.value }))
      ]);
    }

    if (data.compliance && data.compliance.totalAlerts > 0) {
      drawSection('Compliance Alerts', [
        { label: 'Expired Items:', value: data.compliance.expiredCount || 0 },
        { label: 'Expiring Soon:', value: data.compliance.expiringSoonCount || 0 },
      ]);
    }

    doc.save(`FSMS_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        disabled={!data || !data.financial}
        className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> CSV
      </button>
      <button
        onClick={exportPDF}
        disabled={!data || !data.financial}
        className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
      >
        <FileText className="w-3.5 h-3.5 text-rose-500" /> PDF
      </button>
    </div>
  );
}
