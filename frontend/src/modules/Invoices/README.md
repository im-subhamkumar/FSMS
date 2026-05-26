# Invoices Module

## Overview

The Invoices module handles student billing within the Flight School Management System. It provides complete invoice lifecycle management including creation, editing, payment recording, status tracking, and PDF export. The module enforces role-based access control (RBAC): students can only view and print their own invoices, while administrators have full CRUD access.

---

## Table of Contents

- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Authentication and Authorization](#authentication-and-authorization)
- [Frontend Components](#frontend-components)
- [Data Flow](#data-flow)
- [Role-Based Access Matrix](#role-based-access-matrix)

---

## Architecture

```
frontend/src/modules/Invoices/
  hooks/
    useInvoices.js          -- Data fetching hook with JWT-authenticated requests
  components/
    InvoiceList.jsx         -- Paginated list with search, filters, and KPI stats
    InvoiceDetail.jsx       -- Single invoice view with payment history and actions
    InvoiceForm.jsx         -- Create/Edit form with dynamic line items and pricing catalog
    InvoiceStats.jsx        -- KPI summary cards (revenue, outstanding, overdue)
    StatusBadge.jsx         -- Reusable status indicator (PENDING, PAID, OVERDUE)
    PrintableInvoice.jsx    -- Print-optimized invoice template (react-to-print)
    RecordPaymentModal.jsx  -- Modal for recording partial or full payments
  pages/
    index.jsx               -- Module router: list, detail, create, edit routes

backend/routes/invoices.js  -- REST API with auth middleware
```

---

## API Reference

Base URL: `/api/invoices`

All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header. Unauthenticated requests receive `401 Access denied`.

### GET /api/invoices/stats

Returns aggregate KPI metrics. When the authenticated user is a student, stats are scoped to their invoices only.

**Query Parameters:** None

**Response (200):**
```json
{
  "totalRevenue": "1560050.00",
  "outstanding": "4000000.00",
  "overdue": "0.00",
  "totalCount": 16,
  "paidCount": 6,
  "pendingCount": 8,
  "overdueCount": 2
}
```

**Authorization:** Any authenticated user. Data is scoped per role.

---

### GET /api/invoices

Returns a list of invoices. Students are automatically filtered to their own invoices via the JWT `id` claim. Admin/Staff can optionally filter by `studentId`.

**Query Parameters:**

| Parameter   | Type   | Description                              |
|-------------|--------|------------------------------------------|
| `status`    | string | Filter by status: `PENDING`, `PAID`, `OVERDUE` |
| `studentId` | int    | Filter by student ID (admin/staff only)  |
| `from`      | date   | Filter invoices issued on or after this date |
| `to`        | date   | Filter invoices issued on or before this date |

**Response (200):**
```json
[
  {
    "id": 1,
    "invoiceNumber": "INV-2026-0001",
    "studentId": 3,
    "status": "PENDING",
    "amount": 450000,
    "paidAmount": 0,
    "issuedDate": "2026-03-15T00:00:00.000Z",
    "dueDate": "2026-04-15T00:00:00.000Z",
    "notes": null,
    "student": {
      "id": 3,
      "firstName": "Test",
      "lastName": "Student",
      "email": "stu.tst@fsms.com"
    },
    "issuedBy": {
      "id": 1,
      "firstName": "System",
      "lastName": "Admin"
    },
    "items": [
      {
        "id": 1,
        "description": "PPL Course Fee",
        "quantity": 1,
        "unitPrice": 450000,
        "totalPrice": 450000
      }
    ]
  }
]
```

**Authorization:**
- `STUDENT` -- returns only invoices where `studentId` matches the JWT `id`.
- `ADMIN`, `STAFF` -- returns all invoices (with optional filters).

---

### GET /api/invoices/:id

Returns a single invoice with full details including line items and payment history.

**Response (200):** Full invoice object with `items[]` and `payments[]` arrays.

**Authorization:**
- `STUDENT` -- returns `403` if the invoice does not belong to the authenticated student.
- `ADMIN`, `STAFF` -- unrestricted access.

---

### POST /api/invoices

Creates a new invoice with optional line items. The total amount is auto-calculated from items if provided.

**Request Body:**
```json
{
  "studentId": 3,
  "issuedById": 1,
  "dueDate": "2026-04-15",
  "notes": "First semester course fee",
  "items": [
    {
      "description": "PPL Course Fee",
      "quantity": 1,
      "unitPrice": 450000
    }
  ]
}
```

**Required Fields:** `studentId`

**Response (201):** Created invoice object with items.

**Authorization:** `ADMIN`, `STAFF` only. Students receive `403`.

---

### PUT /api/invoices/:id

Updates invoice metadata (notes, due date) and optionally replaces all line items. Line item edits are blocked on non-PENDING invoices to preserve financial integrity.

**Request Body:**
```json
{
  "notes": "Updated payment terms",
  "dueDate": "2026-05-01",
  "items": [
    { "description": "Updated item", "quantity": 2, "unitPrice": 225000 }
  ]
}
```

**Authorization:** `ADMIN`, `STAFF` only. Students receive `403`.

---

### PATCH /api/invoices/:id/status

Updates the invoice status. When transitioning to `PAID`, the system automatically creates a payment record for the remaining balance to maintain ledger integrity.

**Request Body:**
```json
{
  "status": "PAID"
}
```

**Valid Statuses:** `PENDING`, `PAID`, `OVERDUE`

**Authorization:** `ADMIN`, `STAFF` only.

---

### POST /api/invoices/:id/payments

Records a payment against an invoice. The system recalculates `paidAmount` and auto-transitions status to `PAID` when the full balance is covered.

**Request Body:**
```json
{
  "amount": 225000,
  "method": "BANK_TRANSFER",
  "notes": "Txn ID: UTR123456789"
}
```

**Payment Methods:** `BANK_TRANSFER`, `CREDIT_CARD`, `CASH`, `CHEQUE`

**Authorization:** `ADMIN`, `STAFF` only.

---

### DELETE /api/invoices/:id

Permanently deletes an invoice. Only invoices with `PENDING` status can be deleted.

**Authorization:** `ADMIN`, `STAFF` only.

---

### POST /api/invoices/:id/items

Adds a single line item to an existing invoice and recalculates the total.

**Authorization:** `ADMIN`, `STAFF` only.

### DELETE /api/invoices/:id/items/:itemId

Removes a line item from an invoice and recalculates the total.

**Authorization:** `ADMIN`, `STAFF` only.

---

## Authentication and Authorization

All invoice endpoints are protected by `authenticateToken` middleware applied at the router level. The JWT payload must contain `{ id, role, name }`.

Role enforcement follows a two-layer approach:

1. **Backend (security boundary):** The `authorizeRoles('ADMIN', 'STAFF')` middleware guards all write endpoints. Read endpoints filter data based on `req.user.role` and `req.user.id`.

2. **Frontend (user experience):** The `useAppStore` provides `user.role` which conditionally hides UI controls (create button, edit/delete actions, status transitions) for students.

---

## Frontend Components

### useInvoices.js

Custom hook providing all invoice CRUD operations. Every `fetch()` call reads the JWT token from `useAppStore` and attaches it as an `Authorization` header. This is required because the hook uses raw `fetch()` instead of the global axios instance.

**Exported Methods:**
- `getInvoices(params)` -- fetch list with optional query filters
- `getInvoice(id)` -- fetch single invoice detail
- `getStats()` -- fetch KPI summary
- `createInvoice(data)` -- create new invoice
- `updateInvoice(id, data)` -- update invoice metadata and items
- `updateStatus(id, status)` -- change invoice status
- `addPayment(id, paymentData)` -- record a payment
- `deleteInvoice(id)` -- delete a PENDING invoice

### InvoiceList.jsx

Paginated table with client-side search, status filter dropdown, and click-to-filter KPI cards. The search behaviour adapts by role:

- **Admin/Staff:** Searches by invoice number, student name, and email.
- **Student:** Searches by invoice number and line item descriptions.

The "Student" column is replaced with a "Description" column for students, showing the first line item with a "+N more" indicator.

### InvoiceDetail.jsx

Full invoice view with header, line items table, payment history ledger, and totals summary. Print/PDF export is available to all roles via `react-to-print`. Administrative actions (edit, delete, status change, record payment) are hidden for students.

### InvoiceStats.jsx

Six KPI cards with click-to-filter behaviour. Students see a reduced set: Outstanding, Overdue amount, Pending count, and Overdue count. Admin-only cards (Total Revenue, Invoices Paid) are hidden.

---

## Role-Based Access Matrix

| Capability              | Admin | Staff | Student |
|--------------------------|-------|-------|---------|
| View all invoices        | Yes   | Yes   | No      |
| View own invoices        | Yes   | Yes   | Yes     |
| View invoice detail      | Yes   | Yes   | Own only|
| Create invoice           | Yes   | Yes   | No      |
| Edit invoice             | Yes   | Yes   | No      |
| Delete invoice           | Yes   | Yes   | No      |
| Change invoice status    | Yes   | Yes   | No      |
| Record payment           | Yes   | Yes   | No      |
| Print/PDF export         | Yes   | Yes   | Yes     |
| View aggregate stats     | Yes   | Yes   | Scoped  |
