// ---------------------------------------------------------------------------
// useInvoices.js -- Data fetching hook for the Invoices module
//
// Provides all CRUD operations for invoices, payments, and stats.
// Uses raw fetch() with manual JWT token attachment (not the global axios
// instance) because the hook was originally built before the centralised
// api.js interceptor was added. The authHeaders() helper reads the token
// from the Zustand store on every call to ensure it stays current.
//
// RBAC note: The backend enforces role-based filtering. When a STUDENT
// token is used, GET /invoices automatically returns only that student's
// invoices. Write operations (POST, PUT, DELETE, PATCH) return 403 for
// students -- the frontend hides these controls, but the backend is the
// actual security boundary.
// ---------------------------------------------------------------------------

import { useCallback } from 'react';
import { useAppStore } from '../../../store/useAppStore';

// Base URL for all invoice API calls. Falls back to same-host port 3000
// if VITE_API_URL is not set in the environment.
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

// Builds request headers with the current JWT token from the auth store.
// Called fresh on every request to handle token refresh or logout scenarios.
function authHeaders() {
  const { token } = useAppStore.getState();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function useInvoices() {

  // Fetch all invoices. Accepts optional query params: { status, studentId, from, to }.
  // For students, the backend ignores the studentId param and auto-filters by JWT id.
  const getInvoices = useCallback(async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/invoices${q ? '?' + q : ''}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  }, []);

  // Fetch a single invoice by ID. Includes line items and payment history.
  // Returns 403 if a student tries to access another student's invoice.
  const getInvoice = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Invoice not found');
    return res.json();
  }, []);

  // Fetch aggregate KPI stats (revenue, outstanding, overdue, counts).
  // Stats are automatically scoped to the student's own invoices when
  // the JWT role is STUDENT.
  const getStats = useCallback(async () => {
    const res = await fetch(`${API_BASE}/invoices/stats`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  }, []);

  // Create a new invoice. Admin/Staff only -- students receive 403.
  // The request body should include studentId, optional items[], dueDate, notes.
  const createInvoice = useCallback(async (data) => {
    const res = await fetch(`${API_BASE}/invoices`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create invoice');
    }
    return res.json();
  }, []);

  // Update invoice metadata (notes, dueDate) and optionally replace all line items.
  // Admin/Staff only. Line item edits are blocked on non-PENDING invoices.
  const updateInvoice = useCallback(async (id, data) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update invoice');
    }
    return res.json();
  }, []);

  // Update invoice status (PENDING, PAID, OVERDUE). Admin/Staff only.
  // When setting to PAID, the backend auto-generates a payment record
  // for the remaining balance to maintain ledger integrity.
  const updateStatus = useCallback(async (id, status) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/status`, {
      method:  'PATCH',
      headers: authHeaders(),
      body:    JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update status');
    }
    return res.json();
  }, []);

  // Record a payment against an invoice. Admin/Staff only.
  // Accepts { amount, method, notes }. The backend recalculates paidAmount
  // and auto-transitions status to PAID if the balance is fully covered.
  const addPayment = useCallback(async (id, paymentData) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/payments`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(paymentData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record payment');
    }
    return res.json();
  }, []);

  // Delete an invoice. Admin/Staff only. Only PENDING invoices can be deleted.
  const deleteInvoice = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete invoice');
    }
    return res.json();
  }, []);

  return { getInvoices, getInvoice, getStats, createInvoice, updateInvoice, updateStatus, addPayment, deleteInvoice };
}
