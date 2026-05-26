# Reports Dashboard API Documentation

Base URL: `/api/reports`

All endpoints are read-only (GET). They accept optional date range query parameters for filtering.

---

## Common Query Parameters

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| from      | string | No       | ISO date string. Records on or after this date.|
| to        | string | No       | ISO date string. Records on or before this date.|

Example: `GET /api/reports/financial?from=2026-01-01&to=2026-03-31`

---

## Endpoints

### GET /api/reports/financial

Aggregates invoice data into financial KPIs and monthly revenue breakdown.

**Response 200:**
```json
{
  "totalRevenue": 15600500,
  "totalBilled": 19600500,
  "collectionRate": 80,
  "pendingAmount": 4000000,
  "overdueCount": 2,
  "overdueAmount": 1242600,
  "monthlyRevenue": [
    { "month": "Dec 25", "amount": 625000 },
    { "month": "Jan 26", "amount": 3295000 },
    { "month": "Feb 26", "amount": 1083000 },
    { "month": "Mar 26", "amount": 6780000 },
    { "month": "Apr 26", "amount": 750000 },
    { "month": "May 26", "amount": 3067500 }
  ],
  "statusBreakdown": [
    { "name": "PAID", "value": 6 },
    { "name": "PENDING", "value": 8 },
    { "name": "OVERDUE", "value": 2 }
  ]
}
```

**Field Details:**

| Field           | Type   | Description                                          |
|-----------------|--------|------------------------------------------------------|
| totalRevenue    | number | Sum of `paidAmount` from invoices with status `PAID` |
| totalBilled     | number | Sum of `amount` from all invoices                    |
| collectionRate  | number | `(totalRevenue / totalBilled) * 100`, rounded        |
| pendingAmount   | number | Unpaid balance on `PENDING` status invoices          |
| overdueCount    | number | Count of invoices with status `OVERDUE`              |
| overdueAmount   | number | Unpaid balance on `OVERDUE` status invoices          |
| monthlyRevenue  | array  | Sorted by month. `month` is a short label (e.g., "Jan 26"). `amount` is the sum of `paidAmount` for PAID invoices issued in that month. |
| statusBreakdown | array  | Count of invoices per status category. Used for pie chart. |

**Computation Notes:**
- `totalRevenue` counts only `paidAmount` from PAID invoices.
- `monthlyRevenue` groups by year-month of `issuedDate`, then sums `paidAmount`.
- Months with zero revenue are omitted from the array.

---

### GET /api/reports/students

Aggregates student enrollment metrics.

**Response 200:**
```json
{
  "totalStudents": 12,
  "activeStudents": 10,
  "inactiveStudents": 2,
  "monthlyJoins": [
    { "month": "Nov 25", "count": 2 },
    { "month": "Dec 25", "count": 3 },
    { "month": "Jan 26", "count": 3 },
    { "month": "Feb 26", "count": 2 },
    { "month": "Mar 26", "count": 2 }
  ]
}
```

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| totalStudents   | number | Total student records                           |
| activeStudents  | number | Students with status `ACTIVE`                   |
| inactiveStudents| number | Students with status `INACTIVE` or `GRADUATED`  |
| monthlyJoins    | array  | Student count grouped by enrollment month       |

---

### GET /api/reports/flights

Aggregates flying slot data.

**Response 200:**
```json
{
  "totalSlots": 157,
  "completedSlots": 89,
  "cancelledSlots": 12,
  "totalFlyingHours": 184,
  "slotActivity": [
    { "month": "Jan 26", "booked": 28, "completed": 22, "cancelled": 3 },
    { "month": "Feb 26", "booked": 32, "completed": 25, "cancelled": 2 }
  ]
}
```

| Field            | Type   | Description                                  |
|------------------|--------|----------------------------------------------|
| totalSlots       | number | Total flying slots across all time            |
| completedSlots   | number | Slots with status `COMPLETED`                |
| cancelledSlots   | number | Slots with status `CANCELLED`                |
| totalFlyingHours | number | Sum of slot durations in hours               |
| slotActivity     | array  | Monthly breakdown of booked, completed, cancelled slots |

---

### GET /api/reports/instructors

Returns instructor workload metrics.

**Response 200:**
```json
{
  "totalInstructors": 4,
  "activeInstructors": 4,
  "slotsPerInstructor": [
    { "name": "Capt Arora", "slots": 54, "hours": 62 },
    { "name": "Capt Das", "slots": 53, "hours": 70 },
    { "name": "Capt Kumar", "slots": 49, "hours": 52 },
    { "name": "Test Instructor", "slots": 1, "hours": 0 }
  ]
}
```

| Field              | Type   | Description                                  |
|--------------------|--------|----------------------------------------------|
| totalInstructors   | number | Total instructor records in the system       |
| activeInstructors  | number | Instructors with at least one assigned slot   |
| slotsPerInstructor | array  | Each entry has `name` (display name), `slots` (assigned count), and `hours` (total flying hours) |

**Frontend Note:** The chart displays `name` as-is on the Y-axis. The backend concatenates `firstName` and `lastName` with any title prefix.

---

### GET /api/reports/courses

Returns course distribution metrics.

**Response 200:**
```json
{
  "totalCourses": 5,
  "studentsPerCourse": [
    { "name": "PPL-01", "students": 8, "level": "BEGINNER" },
    { "name": "CPL-01", "students": 4, "level": "INTERMEDIATE" },
    { "name": "IR-01", "students": 3, "level": "ADVANCED" }
  ]
}
```

| Field            | Type   | Description                                  |
|------------------|--------|----------------------------------------------|
| totalCourses     | number | Total course records                         |
| studentsPerCourse| array  | Each entry has `name` (course code), `students` (enrolled count), and `level` |

---

### GET /api/reports/fleet

Returns aircraft status distribution and per-aircraft utilization.

**Response 200:**
```json
{
  "totalAircraft": 4,
  "statusDistribution": [
    { "name": "Airworthy", "value": 4 }
  ],
  "utilization": [
    { "tailNumber": "VT-BXA", "slots": 42, "hours": 58 },
    { "tailNumber": "VT-PRA", "slots": 37, "hours": 48 },
    { "tailNumber": "VT-MKJ", "slots": 41, "hours": 40 },
    { "tailNumber": "VT-DEF", "slots": 37, "hours": 38 }
  ],
  "openSquawks": 1
}
```

| Field              | Type   | Description                                       |
|--------------------|--------|---------------------------------------------------|
| totalAircraft      | number | Total aircraft in the fleet                       |
| statusDistribution | array  | Count per status: `Airworthy`, `In Maintenance`, `AOG` |
| utilization        | array  | Per-aircraft: `tailNumber`, `slots` (assigned count), `hours` (flight hours) |
| openSquawks        | number | Count of unresolved maintenance squawks            |

---

### GET /api/reports/compliance

Returns licenses, medicals, and documents that are expired or expiring within 30 days.

**Response 200:**
```json
{
  "expiredCount": 1,
  "expiringSoonCount": 3,
  "alerts": [
    {
      "entity": "Capt Arora",
      "detail": "Class 1 Medical Certificate",
      "type": "Medical",
      "status": "EXPIRING",
      "expiryDate": "2026-06-10T00:00:00.000Z"
    },
    {
      "entity": "VT-BXA",
      "detail": "Certificate of Airworthiness",
      "type": "Document",
      "status": "EXPIRED",
      "expiryDate": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

| Field            | Type   | Description                                       |
|------------------|--------|---------------------------------------------------|
| expiredCount     | number | Count of items past their expiry date             |
| expiringSoonCount| number | Count of items expiring within 30 days            |
| alerts           | array  | Individual alert items                            |
| alerts[].entity  | string | Person name or aircraft tail number               |
| alerts[].detail  | string | Description of the expiring item                  |
| alerts[].type    | string | Category: `License`, `Medical`, or `Document`     |
| alerts[].status  | string | `EXPIRED` or `EXPIRING`                           |
| alerts[].expiryDate | string | ISO date of expiry                             |

---

## Error Response Format

All report endpoints return errors in the following format:

```json
{
  "error": "Human-readable error description"
}
```

**Status Codes:**
- `200` -- Successful response
- `500` -- Internal server error (database issues, unexpected failures)

Note: Report endpoints do not currently require authentication. They are read-only aggregate views intended for admin consumption.
