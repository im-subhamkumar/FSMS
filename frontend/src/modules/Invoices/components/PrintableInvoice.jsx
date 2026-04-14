// T3 — PrintableInvoice (T10 bonus: react-to-print template)
// Hidden on screen, visible during print.
// Used with react-to-print in InvoiceDetail.

import React from 'react';

const fmt = (val) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(val) || 0);
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const PrintableInvoice = React.forwardRef(function PrintableInvoice({ invoice }, ref) {
  if (!invoice) return null;

  const subtotal = invoice.items?.reduce((s, it) => s + parseFloat(it.totalPrice || 0), 0) || 0;
  const balanceDue = parseFloat(invoice.amount || 0) - parseFloat(invoice.paidAmount || 0);

  return (
    <div ref={ref} className="p-8 font-sans text-black bg-white" style={{ padding: '32px', fontFamily: 'sans-serif', color: '#000', backgroundColor: '#fff' }}>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* School Header */}
      <div style={{ borderBottom: '3px solid #1d4ed8', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#1d4ed8', letterSpacing: '-0.5px' }}>
            ✈ Flight School FSMS
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Flight School Management System · India
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#111827', fontFamily: 'monospace' }}>
            INVOICE
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8', fontFamily: 'monospace' }}>
            {invoice.invoiceNumber}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            Status: <span style={{ fontWeight: '700', color: invoice.status === 'PAID' ? '#16a34a' : invoice.status === 'OVERDUE' ? '#dc2626' : '#d97706' }}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: 'flex', gap: '40px', marginBottom: '24px', fontSize: '12px' }}>
        <div><div style={{ color: '#6b7280', fontWeight: '600' }}>ISSUED DATE</div><div style={{ fontWeight: '700' }}>{fmtDate(invoice.issuedDate)}</div></div>
        <div><div style={{ color: '#6b7280', fontWeight: '600' }}>DUE DATE</div><div style={{ fontWeight: '700', color: invoice.status === 'OVERDUE' ? '#dc2626' : '#111827' }}>{fmtDate(invoice.dueDate)}</div></div>
        <div><div style={{ color: '#6b7280', fontWeight: '600' }}>ISSUED BY</div><div style={{ fontWeight: '700' }}>{invoice.issuedBy?.firstName} {invoice.issuedBy?.lastName}</div></div>
      </div>

      {/* Bill To */}
      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px', borderLeft: '4px solid #1d4ed8' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px' }}>BILLED TO</div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{invoice.student?.firstName} {invoice.student?.lastName}</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{invoice.student?.email}</div>
      </div>

      {/* Line Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#1d4ed8', color: 'white' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>Description</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', width: '60px' }}>Qty</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', width: '100px' }}>Unit Price</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', width: '110px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, idx) => (
            <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
              <td style={{ padding: '9px 12px', borderBottom: '1px solid #e5e7eb' }}>{item.description}</td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{item.quantity}</td>
              <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>₹{fmt(item.unitPrice)}</td>
              <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: '700', borderBottom: '1px solid #e5e7eb' }}>₹{fmt(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payment History (if any) */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>PAYMENT HISTORY</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ color: '#6b7280', textAlign: 'left' }}>
                <th style={{ padding: '4px 0', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '4px 0', fontWeight: '600' }}>Method</th>
                <th style={{ padding: '4px 0', fontWeight: '600' }}>Reference</th>
                <th style={{ padding: '4px 0', fontWeight: '600', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((pmt, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '6px 0', color: '#4b5563' }}>{fmtDateTime(pmt.paidAt || pmt.date || pmt.createdAt)}</td>
                  <td style={{ padding: '6px 0', fontWeight: '600', color: '#111827' }}>{pmt.method}</td>
                  <td style={{ padding: '6px 0', color: '#6b7280' }}>{pmt.notes || '—'}</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>₹{fmt(pmt.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
        <div style={{ minWidth: '240px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#6b7280' }}>
            <span>Subtotal</span><span style={{ fontWeight: '600', color: '#111827' }}>₹{fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#16a34a' }}>
            <span>Amount Paid</span><span style={{ fontWeight: '600' }}>₹{fmt(invoice.paidAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#1d4ed8', color: 'white', borderRadius: '8px', marginTop: '6px' }}>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>Balance Due</span>
            <span style={{ fontWeight: '900', fontSize: '16px' }}>₹{fmt(balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ padding: '12px', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '12px', marginBottom: '24px' }}>
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>Notes</div>
          <div style={{ color: '#6b7280' }}>{invoice.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
        Generated by FSMS · Flight School Management System · {new Date().getFullYear()}
      </div>
    </div>
  );
});

export default PrintableInvoice;
