import { useCallback } from 'react';

// T3 — useInvoices hook (T10-aligned: userId, amount, PENDING/PAID/OVERDUE)
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export function useInvoices() {
  const getInvoices = useCallback(async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/invoices${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  }, []);

  const getInvoice = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`);
    if (!res.ok) throw new Error('Invoice not found');
    return res.json();
  }, []);

  const getStats = useCallback(async () => {
    const res = await fetch(`${API_BASE}/invoices/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  }, []);

  const createInvoice = useCallback(async (data) => {
    // data shape: { studentId, issuedById, dueDate, notes, amount, items[] }
    const res = await fetch(`${API_BASE}/invoices`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create invoice');
    }
    return res.json();
  }, []);

  const updateInvoice = useCallback(async (id, data) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update invoice');
    }
    return res.json();
  }, []);

  // T10 required: PATCH /api/invoices/:id/status
  const updateStatus = useCallback(async (id, status) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update status');
    }
    return res.json();
  }, []);

  const addPayment = useCallback(async (id, paymentData) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/payments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(paymentData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record payment');
    }
    return res.json();
  }, []);

  const deleteInvoice = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete invoice');
    }
    return res.json();
  }, []);

  return { getInvoices, getInvoice, getStats, createInvoice, updateInvoice, updateStatus, addPayment, deleteInvoice };
}
