import React from 'react';
import jsPDF from 'jspdf';
import { FileSpreadsheet, FileText } from 'lucide-react';

export default function ExportButtons({ dateRange, data }) {
  const exportCSV = () => {
    if (!data || !data.financial) return;

    const csvRows = [];
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Report Start', dateRange.from || 'All Time']);
    csvRows.push(['Report End', dateRange.to || 'Present']);
    csvRows.push(['']);
    
    // Financials
    csvRows.push(['Financial summary', '']);
    csvRows.push(['Total Revenue (Paid)', data.financial.totalRevenue || 0]);
    csvRows.push(['Pending Amount', data.financial.pendingAmount || 0]);
    csvRows.push(['Overdue Amount', data.financial.overdueAmount || 0]);
    csvRows.push(['Overdue Invoices', data.financial.overdueCount || 0]);
    csvRows.push(['']);

    // Operations
    csvRows.push(['Operations summary', '']);
    csvRows.push(['Total Active Students', data.students?.activeStudents || 0]);
    csvRows.push(['Total Flight Hours', data.flights?.totalFlyingHours || 0]);
    csvRows.push(['Total Flight Slots', data.flights?.totalSlots || 0]);
    csvRows.push(['Completed Slots', data.flights?.completedSlots || 0]);
    csvRows.push(['Cancelled Slots', data.flights?.cancelledSlots || 0]);
    csvRows.push(['']);

    // Staffing & Courses
    csvRows.push(['Staff & Courses', '']);
    csvRows.push(['Total Active Instructors', data.instructors?.activeInstructors || 0]);
    csvRows.push(['Total Courses', data.courses?.totalCourses || 0]);

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
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FSMS Report Dashboard', 15, yPos);
    yPos += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, yPos);
    doc.text(`Filter Date Range: ${dateRange.from || 'Start'} to ${dateRange.to || 'End'}`, 120, yPos);
    yPos += 20;

    // Helper to draw a section
    const drawSection = (title, metrics) => {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(title, 15, yPos);
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
      metrics.forEach(m => {
        doc.text(m.label, 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(String(m.value), 120, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 8;
      });
      yPos += 10;
    };

    drawSection('Financial Metrics', [
      { label: 'Total Revenue (Paid):', value: `INR ${data.financial.totalRevenue?.toLocaleString() || 0}` },
      { label: 'Outstanding Pending:', value: `INR ${data.financial.pendingAmount?.toLocaleString() || 0}` },
      { label: 'Overdue Amount:', value: `INR ${data.financial.overdueAmount?.toLocaleString() || 0}` },
      { label: 'Overdue Invoices Count:', value: data.financial.overdueCount || 0 },
    ]);

    drawSection('Operational Metrics', [
      { label: 'Total Active Students:', value: data.students?.activeStudents || 0 },
      { label: 'Total Flight Hours:', value: `${data.flights?.totalFlyingHours || 0} hrs` },
      { label: 'Flight Slots (Completed/Total):', value: `${data.flights?.completedSlots || 0} / ${data.flights?.totalSlots || 0}` },
    ]);

    drawSection('Academy & Staff', [
      { label: 'Total Active Instructors:', value: data.instructors?.activeInstructors || 0 },
      { label: 'Total Courses Offered:', value: data.courses?.totalCourses || 0 },
    ]);

    doc.save(`FSMS_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex items-center space-x-3 mt-4 md:mt-0 ml-auto">
      <button 
        onClick={exportCSV}
        disabled={!data || !data.financial}
        className="px-4 py-2 text-sm font-semibold border border-gray-200 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" /> Download CSV
      </button>
      <button 
        onClick={exportPDF}
        disabled={!data || !data.financial}
        className="px-4 py-2 text-sm font-semibold border border-gray-200 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
      >
        <FileText className="w-4 h-4 mr-2 text-rose-600" /> Download PDF
      </button>
    </div>
  );
}
