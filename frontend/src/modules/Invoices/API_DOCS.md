# Invoices API Documentation

Base URL: `/api/invoices`

All endpoints require JWT authentication. Include the token as `Authorization: Bearer <token>` in the request header.

---

## Endpoints

### GET /api/invoices/stats

Returns aggregate financial KPI metrics.

- Students receive stats scoped to their own invoices only.
- Admin/Staff receive system-wide stats.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "totalRevenue": "15600500.00",
  "outstanding": "4000000.00",
  "overdue": "0.00",
  "totalCount": 16,
  "paidCount": 6,
  "pendingCount": 8,
  "overdueCount": 2
}
```

| Field          | Type   | Description                                 |
|----------------|--------|---------------------------------------------|
| totalRevenue   | string | Sum of `paidAmount` across matching invoices |
| outstanding    | string | Unpaid balance on PENDING and OVERDUE invoices |
| overdue        | string | Unpaid balance on OVERDUE invoices only      |
| totalCount     | int    | Total number of matching invoices            |
| paidCount      | int    | Number of PAID invoices                      |
| pendingCount   | int    | Number of PENDING invoices                   |
| overdueCount   | int    | Number of OVERDUE invoices                   |

---

### GET /api/invoices

Returns a paginated list of invoices with student details and line items.

**Query Parameters:**

| Parameter   | Type   | Required | Description                                   |
|-------------|--------|----------|-----------------------------------------------|
| status      | string | No       | Filter: `PENDING`, `PAID`, or `OVERDUE`       |
| studentId   | int    | No       | Filter by student (ignored for STUDENT role)  |
| from        | string | No       | ISO date. Invoices issued on or after.        |
| to          | string | No       | ISO date. Invoices issued on or before.       |

**RBAC Behaviour:**
- `STUDENT` role: The `studentId` filter is automatically set to `req.user.id`. Query parameter `studentId` is ignored.
- `ADMIN` / `STAFF`: All invoices returned unless filtered.

**Response 200:**
```json
[
  {
    "id": 1,
    "invoiceNumber": "INV-2026-0001",
    "studentId": 3,
    "status": "PENDING",
    "amount": 450000.00,
    "paidAmount": 0.00,
    "issuedDate": "2026-03-15T00:00:00.000Z",
    "dueDate": "2026-04-15T00:00:00.000Z",
    "notes": null,
    "createdAt": "2026-03-15T10:30:00.000Z",
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
        "unitPrice": 450000.00,
        "totalPrice": 450000.00
      }
    ]
  }
]
```

---

### GET /api/invoices/:id

Returns a single invoice with full line items and payment history.

**Path Parameters:**

| Parameter | Type | Description          |
|-----------|------|----------------------|
| id        | int  | Invoice primary key  |

**RBAC Behaviour:**
- `STUDENT`: Returns `403` with `"Access denied: This invoice does not belong to you."` if the invoice `studentId` does not match `req.user.id`.
- `ADMIN` / `STAFF`: Unrestricted.

**Response 200:**
```json
{
  "id": 1,
  "invoiceNumber": "INV-2026-0001",
  "status": "PENDING",
  "amount": 450000.00,
  "paidAmount": 100000.00,
  "student": { "id": 3, "firstName": "Test", "lastName": "Student", "email": "stu.tst@fsms.com" },
  "issuedBy": { "id": 1, "firstName": "System", "lastName": "Admin", "role": "ADMIN" },
  "items": [ ... ],
  "payments": [
    {
      "id": 1,
      "amount": 100000.00,
      "method": "BANK_TRANSFER",
      "notes": "UTR123456",
      "paidAt": "2026-03-20T14:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404`: Invoice not found
- `403`: Student attempting to access another student's invoice

---

### POST /api/invoices

Creates a new invoice with optional line items.

**Authorization:** `ADMIN`, `STAFF` only. Students receive `403`.

**Request Body:**
```json
{
  "studentId": 3,
  "issuedById": 1,
  "dueDate": "2026-04-15",
  "notes": "First semester course fee",
  "amount": 450000,
  "items": [
    {
      "description": "PPL-01 Private Pilot License (Course Fee)",
      "quantity": 1,
      "unitPrice": 450000
    }
  ]
}
```

| Field       | Type   | Required | Description                                     |
|-------------|--------|----------|-------------------------------------------------|
| studentId   | int    | Yes      | ID of the student being billed                  |
| issuedById  | int    | No       | ID of the issuing admin/staff. Auto-resolved if omitted. |
| dueDate     | string | No       | ISO date for payment due date                   |
| notes       | string | No       | Internal notes                                  |
| amount      | float  | No       | Manual total. Overridden by items if provided.  |
| items       | array  | No       | Line items. Each requires `description`, `unitPrice`. |

**Response 201:** Created invoice object with computed totals.

**Error Responses:**
- `400`: Missing `studentId` or invalid data
- `403`: Insufficient permissions (student role)

---

### PATCH /api/invoices/:id/status

Updates the invoice status. Transitioning to `PAID` auto-generates a payment record for the remaining balance.

**Authorization:** `ADMIN`, `STAFF` only.

**Request Body:**
```json
{
  "status": "PAID"
}
```

| Field  | Type   | Required | Description                                |
|--------|--------|----------|--------------------------------------------|
| status | string | Yes      | One of: `PENDING`, `PAID`, `OVERDUE`       |

**Auto-Payment Logic:**
When status is set to `PAID` and there is an unpaid balance, the system creates a `Payment` record with method `MANUAL_OVERRIDE` and recalculates `paidAmount`.

**Response 200:** Updated invoice with payments.

---

### POST /api/invoices/:id/payments

Records a partial or full payment against an invoice.

**Authorization:** `ADMIN`, `STAFF` only.

**Request Body:**
```json
{
  "amount": 225000.00,
  "method": "BANK_TRANSFER",
  "notes": "Txn ID: UTR123456789"
}
```

| Field  | Type   | Required | Description                                       |
|--------|--------|----------|---------------------------------------------------|
| amount | float  | Yes      | Payment amount. Must be greater than 0.            |
| method | string | No       | Default: `BANK_TRANSFER`. Options: `BANK_TRANSFER`, `CREDIT_CARD`, `CASH`, `CHEQUE` |
| notes  | string | No       | Reference number or internal note                  |

**Auto-Status Logic:**
After recording the payment, the system recalculates `paidAmount`. If `paidAmount >= amount`, the invoice status is automatically set to `PAID`.

**Response 201:** Updated invoice with all payments.

---

### PUT /api/invoices/:id

Updates invoice metadata and optionally replaces all line items.

**Authorization:** `ADMIN`, `STAFF` only.

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

**Constraint:** Line item replacement is only allowed on `PENDING` invoices. Attempting to modify items on `PAID` or `OVERDUE` invoices returns `400`.

**Response 200:** Updated invoice.

---

### DELETE /api/invoices/:id

Permanently deletes an invoice and its associated line items.

**Authorization:** `ADMIN`, `STAFF` only.

**Constraint:** Only `PENDING` invoices can be deleted. Returns `400` for non-PENDING.

**Response 200:**
```json
{
  "message": "Invoice INV-2026-0001 deleted successfully"
}
```

---

### POST /api/invoices/:id/items

Adds a single line item to an existing invoice and recalculates the total amount.

**Authorization:** `ADMIN`, `STAFF` only.

**Request Body:**
```json
{
  "description": "Additional flight hours",
  "quantity": 5,
  "unitPrice": 8500
}
```

**Response 201:**
```json
{
  "item": { "id": 12, "description": "Additional flight hours", "quantity": 5, "unitPrice": 8500, "totalPrice": 42500 },
  "newAmount": 492500
}
```

---

### DELETE /api/invoices/:id/items/:itemId

Removes a single line item and recalculates the invoice total.

**Authorization:** `ADMIN`, `STAFF` only.

**Response 200:**
```json
{
  "message": "Item removed",
  "newAmount": 450000
}
```

---

## Error Response Format

All error responses follow a consistent structure:

```json
{
  "error": "Human-readable error description"
}
```

Or for auth errors:
```json
{
  "message": "Access denied. No token provided."
}
```

**Common Status Codes:**
- `400` -- Validation error or business rule violation
- `401` -- Missing or invalid JWT token
- `403` -- Insufficient role permissions or ownership violation
- `404` -- Invoice not found
- `500` -- Internal server error
