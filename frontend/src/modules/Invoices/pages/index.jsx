// T3 — Invoices module entry point
// Sub-routes: list (with modal) and detail view
// Note: /new route removed — create is now a modal on the list page (T10 spec)

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InvoiceList   from '../components/InvoiceList';
import InvoiceDetail from '../components/InvoiceDetail';
import InvoiceForm   from '../components/InvoiceForm';

export default function InvoicesRoot() {
  return (
    <Routes>
      <Route index element={<InvoiceList />} />
      <Route path="new" element={<InvoiceForm />} />
      <Route path=":id" element={<InvoiceDetail />} />
      <Route path=":id/edit" element={<InvoiceForm />} />
    </Routes>
  );
}
