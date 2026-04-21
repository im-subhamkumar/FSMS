// T3 — InvoiceDetail ( invoiceNumber, amount, 3 statuses + react-to-print)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, Trash2, Printer, CheckCheck, AlertCircle, Clock, IndianRupee } from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';
import StatusBadge from './StatusBadge';
import PrintableInvoice from './PrintableInvoice';
import RecordPaymentModal from './RecordPaymentModal';
import { Edit2 } from 'lucide-react';

const fmt     = (val) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(val) || 0);
const fmtDate = (d)   => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

//  spec: PENDING ↔ PAID ↔ OVERDUE
const STATUS_ACTIONS = {
  PENDING: [
    { label: 'Record Payment', icon: IndianRupee,    id: 'RECORD_PAYMENT', color: 'bg-green-600 hover:bg-green-700 text-white' },
    { label: 'Mark as Overdue', icon: AlertCircle,  id: 'MARK_OVERDUE',   color: 'bg-red-600 hover:bg-red-700 text-white' },
  ],
  OVERDUE: [
    { label: 'Record Payment', icon: IndianRupee,    id: 'RECORD_PAYMENT', color: 'bg-green-600 hover:bg-green-700 text-white' },
    { label: 'Set Pending',     icon: Clock,        id: 'MARK_PENDING',   color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  ],
  PAID: [],
};

export default function InvoiceDetail() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const printRef      = useRef();
  const { getInvoice, updateStatus, deleteInvoice, addPayment } = useInvoices();

  const [invoice,           setInvoice]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [actionLoading,     setActionLoading]     = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPaymentModal,  setShowPaymentModal]  = useState(false);
  const [successMessage,    setSuccessMessage]    = useState(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice?.invoiceNumber || 'Invoice',
  });

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const data = await getInvoice(id);
      setInvoice(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const handleAction = async (actionId) => {
    if (actionId === 'RECORD_PAYMENT') return setShowPaymentModal(true);
    
    // Fallback status map
    const mappedStatus = actionId === 'MARK_OVERDUE' ? 'OVERDUE' : 'PENDING';
    
    setActionLoading(true);
    try {
      await updateStatus(id, mappedStatus);
      await fetchInvoice();
      setSuccessMessage(`Invoice status updated to ${mappedStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      await addPayment(id, paymentData);
      await fetchInvoice();
      setSuccessMessage('Payment recorded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(id);
      navigate('/invoices');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
        <p className="font-semibold text-lg">{error || 'Invoice not found'}</p>
        <button onClick={() => navigate('/invoices')} className="text-sm underline text-gray-500">Go back</button>
      </div>
    );
  }

  const actions   = STATUS_ACTIONS[invoice.status] || [];
  const subtotal  = invoice.items?.reduce((s, it) => s + parseFloat(it.totalPrice || 0), 0) || 0;
  const balanceDue = parseFloat(invoice.amount || 0) - parseFloat(invoice.paidAmount || 0);

  return (
    <div className="flex flex-col gap-6">

      {/* Success toast banner */}
      {successMessage && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-semibold animate-pulse shadow-sm">
          <CheckCheck className="w-4 h-4" />
          {successMessage}
        </div>
      )}

      {/* Hidden print template */}
      <div style={{ display: 'none' }}>
        <PrintableInvoice ref={printRef} invoice={invoice} />
      </div>

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Invoice Details
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Print / PDF — T10 bonus */}
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Printer className="w-4 h-4" /> Print / PDF
          </button>

          {/* Edit Invoice — only for PENDING */}
          {invoice.status === 'PENDING' && (
            <button onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}

          {/* Delete — only for PENDING */}
          {invoice.status === 'PENDING' && (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}

          {/* Status transition buttons */}
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <button key={action.id} onClick={() => handleAction(action.id)}
                disabled={actionLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-60 ${action.color}`}>
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

        {/* Header gradient band */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Invoice</p>
            <h2 className="text-3xl font-black font-mono text-gray-900 dark:text-white">{invoice.invoiceNumber}</h2>
            <div className="mt-3"><StatusBadge status={invoice.status} size="lg" /></div>
          </div>
          <div className="text-right space-y-1 text-sm">
            <p className="text-gray-500">Issued: <span className="font-bold text-gray-700 dark:text-gray-200">{fmtDate(invoice.issuedDate)}</span></p>
            <p className={invoice.status === 'OVERDUE' ? 'font-bold text-red-600 dark:text-red-400' : 'text-gray-500'}>
              Due: <span className="font-bold">{fmtDate(invoice.dueDate)}</span>
            </p>
            <p className="text-gray-500">Issued by: <span className="font-bold text-gray-700 dark:text-gray-200">
              {invoice.issuedBy?.firstName} {invoice.issuedBy?.lastName}
            </span></p>
          </div>
        </div>

        {/* Billed to */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{invoice.student?.firstName} {invoice.student?.lastName}</p>
          <p className="text-sm text-gray-400">{invoice.student?.email}</p>
        </div>

        {/* Line items */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Line Items</p>
          {!invoice.items?.length ? (
            <p className="text-sm text-gray-400 italic">No line items.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                  {['Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                    <th key={h} className={`pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h !== 'Description' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {invoice.items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 font-medium text-gray-700 dark:text-gray-300">{item.description}</td>
                    <td className="py-3 text-right text-gray-500">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-500">₹{fmt(item.unitPrice)}</td>
                    <td className="py-3 text-right font-bold text-gray-900 dark:text-white">₹{fmt(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Payments Ledger */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment History</p>
          {!invoice.payments?.length ? (
            <p className="text-sm text-gray-400 italic">No payments recorded.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {invoice.payments.map((pmt, i) => (
                  <tr key={i} className="hover:bg-white dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-2 text-gray-500 whitespace-nowrap">{fmtDateTime(pmt.paidAt || pmt.date || pmt.createdAt)}</td>
                    <td className="py-2 font-medium text-gray-700 dark:text-gray-300">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs">{pmt.method}</span>
                    </td>
                    <td className="py-2 text-gray-500">{pmt.notes || '—'}</td>
                    <td className="py-2 text-right font-bold text-green-600 dark:text-green-400">₹{fmt(pmt.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals */}
        <div className="px-6 py-5 flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">₹{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Amount Paid</span>
              <span className="font-semibold">₹{fmt(invoice.paidAmount)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">Balance Due</span>
              <span className="font-black text-xl text-blue-600 dark:text-blue-400">₹{fmt(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-6 pb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Invoice?</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will permanently delete <span className="font-mono font-bold text-gray-700 dark:text-gray-200">{invoice.invoiceNumber}</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal 
          invoice={invoice} 
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handleRecordPayment}
        />
      )}
    </div>
  );
}
