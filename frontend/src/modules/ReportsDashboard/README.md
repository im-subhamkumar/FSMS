# Reports Dashboard Module

## Overview

The Reports Dashboard is a read-only administrative module that aggregates operational and financial data from across the Flight School Management System into a single-page dashboard. It pulls live data from seven backend endpoints covering financial performance, student enrollment, flight operations, instructor workload, course distribution, fleet status, and compliance alerts.

---

## Table of Contents

- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Frontend Components](#frontend-components)
- [Data Flow](#data-flow)
- [Currency Formatting](#currency-formatting)
- [Chart Design Decisions](#chart-design-decisions)

---

## Architecture

```
frontend/src/modules/ReportsDashboard/
  hooks/
    useReportData.js          -- Fetches all 7 report endpoints in parallel
  components/
    KPICard.jsx               -- Reusable metric card with icon, value, subtitle
    RevenueBarChart.jsx       -- Monthly revenue trend (Indian Lakhs/Cr formatting)
    InvoiceStatusPieChart.jsx -- Invoice status breakdown pie chart
    SlotActivityLineChart.jsx -- Flying slot bookings over time
    StudentGrowthChart.jsx    -- Monthly student enrollment line chart
    CoursesByLevelChart.jsx   -- Students per course bar chart
    InstructorSlotsChart.jsx  -- Horizontal bar chart of instructor workload
    FleetStatusChart.jsx      -- Aircraft status pills and utilization chart
    ComplianceAlerts.jsx      -- Scrollable list of expiring licenses/medicals
    FilterBar.jsx             -- Date range picker with export buttons
    ExportButtons.jsx         -- CSV and PDF export functionality
  pages/
    index.jsx                 -- Main dashboard layout with sections

backend/routes/reportRoutes.js -- Seven GET endpoints under /api/reports/
```

---

## API Reference

Base URL: `/api/reports`

All endpoints accept optional date range filters via query parameters.

**Common Query Parameters:**

| Parameter | Type   | Description                              |
|-----------|--------|------------------------------------------|
| from      | string | ISO date. Filter records created on or after. |
| to        | string | ISO date. Filter records created on or before. |

---

### GET /api/reports/financial

Returns revenue, billing, and invoice status metrics.

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
    { "month": "Mar 26", "amount": 6780000 }
  ],
  "statusBreakdown": [
    { "name": "PAID", "value": 6 },
    { "name": "PENDING", "value": 8 },
    { "name": "OVERDUE", "value": 2 }
  ]
}
```

| Field           | Type   | Description                                   |
|-----------------|--------|-----------------------------------------------|
| totalRevenue    | int    | Sum of paidAmount across all PAID invoices     |
| totalBilled     | int    | Sum of amount across all invoices              |
| collectionRate  | int    | Percentage: totalRevenue / totalBilled * 100   |
| pendingAmount   | int    | Unpaid balance on PENDING invoices             |
| overdueCount    | int    | Number of OVERDUE invoices                     |
| overdueAmount   | int    | Unpaid balance on OVERDUE invoices             |
| monthlyRevenue  | array  | Monthly breakdown with `month` label and `amount` |
| statusBreakdown | array  | Count per status for pie chart                 |

---

### GET /api/reports/students

Returns student enrollment metrics and monthly join trends.

**Response 200:**
```json
{
  "totalStudents": 12,
  "activeStudents": 10,
  "inactiveStudents": 2,
  "monthlyJoins": [
    { "month": "Jan 26", "count": 3 },
    { "month": "Feb 26", "count": 2 }
  ]
}
```

---

### GET /api/reports/flights

Returns flying slot statistics and slot activity trends.

**Response 200:**
```json
{
  "totalSlots": 157,
  "completedSlots": 89,
  "cancelledSlots": 12,
  "totalFlyingHours": 184,
  "slotActivity": [
    { "month": "Jan 26", "booked": 28, "completed": 22, "cancelled": 3 }
  ]
}
```

---

### GET /api/reports/instructors

Returns instructor workload data.

**Response 200:**
```json
{
  "totalInstructors": 4,
  "activeInstructors": 4,
  "slotsPerInstructor": [
    { "name": "Capt Arora", "slots": 54, "hours": 62 },
    { "name": "Capt Das", "slots": 53, "hours": 70 }
  ]
}
```

---

### GET /api/reports/courses

Returns course distribution data.

**Response 200:**
```json
{
  "totalCourses": 5,
  "studentsPerCourse": [
    { "name": "PPL-01", "students": 8, "level": "BEGINNER" },
    { "name": "CPL-01", "students": 4, "level": "INTERMEDIATE" }
  ]
}
```

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
    { "tailNumber": "VT-PRA", "slots": 37, "hours": 48 }
  ],
  "openSquawks": 1
}
```

---

### GET /api/reports/compliance

Returns licenses, medicals, and documents expiring within 30 days or already expired.

**Response 200:**
```json
{
  "expiredCount": 1,
  "expiringSoonCount": 3,
  "alerts": [
    {
      "entity": "Capt Arora",
      "detail": "Class 1 Medical",
      "type": "Medical",
      "status": "EXPIRING",
      "expiryDate": "2026-06-10T00:00:00.000Z"
    }
  ]
}
```

---

## Frontend Components

### useReportData.js

Custom hook that fetches all seven report endpoints in parallel using `Promise.all`. Returns a unified `data` object with keys: `financial`, `students`, `flights`, `instructors`, `courses`, `fleet`, `compliance`. Supports date range filtering and manual refresh.

**Returned Interface:**
```javascript
{
  dateRange,      // { from: string, to: string }
  setDateRange,   // function to update date range (triggers refetch)
  data,           // aggregated report data object
  loading,        // boolean
  error,          // string or null
  refetch         // manual refresh function
}
```

### KPICard.jsx

Generic card component used in the top summary row. Displays a single metric with an icon, value, label, and optional subtitle. Supports loading skeleton state.

**Props:** `label`, `value`, `icon`, `iconBg`, `loading`, `subtitle`

### RevenueBarChart.jsx

Vertical bar chart showing monthly revenue trends. Uses Indian number formatting on both the Y-axis labels and tooltips:
- Values above 1 Crore display as `1.56Cr`
- Values above 1 Lakh display as `32.9L`
- Values above 1 Thousand display as `625K`

### InstructorSlotsChart.jsx

Horizontal bar chart displaying instructor workload by assigned flying slots. Uses full instructor names on the Y-axis (e.g., "Capt Arora") with each bar individually coloured for visual distinction. Tooltip displays slot count.

### FleetStatusChart.jsx

Combines two visualisations in a single card:
1. **Status pills** at the top showing counts per status category (Airworthy, In Maintenance, AOG) with corresponding icons.
2. **Horizontal bar chart** below showing flight hours per aircraft, identified by tail number (e.g., VT-BXA).

### ComplianceAlerts.jsx

Scrollable list of compliance items (licenses, medicals, documents) that are either expired or expiring within 30 days. Each item shows the entity name, detail, type badge, and expiry date. Header displays aggregate counts for expired and expiring items.

### FilterBar.jsx

Date range picker component with "from" and "to" date inputs. Includes refresh and export action buttons.

---

## Currency Formatting

All monetary values in the Reports Dashboard follow Indian currency conventions:

| Value Range        | Format     | Example         |
|--------------------|------------|-----------------|
| >= 1,00,00,000     | Crore      | `1.56 Cr`       |
| >= 1,00,000        | Lakhs      | `32.95 L`       |
| >= 1,000           | Thousands  | `625K`          |
| < 1,000            | Raw        | `850`           |

This is implemented via the `fmtINR()` helper in the dashboard page and the `formatAxisLabel()` / `formatIndianCurrency()` helpers in `RevenueBarChart.jsx`.

---

## Chart Design Decisions

| Chart                   | Type            | Rationale                                                |
|-------------------------|-----------------|----------------------------------------------------------|
| Revenue Trend           | Vertical Bar    | Best for comparing discrete monthly values               |
| Invoice Status          | Pie / Donut     | Shows proportional breakdown of 3 categories             |
| Slot Activity           | Line Chart      | Shows trends over time for booked/completed/cancelled    |
| Student Growth          | Line Chart      | Shows enrollment trend over months                       |
| Courses by Level        | Vertical Bar    | Compares student count across courses                    |
| Instructor Workload     | Horizontal Bar  | Full names fit on Y-axis without truncation              |
| Fleet Status            | Horizontal Bar  | Tail numbers as labels; status pills for quick summary   |
| Compliance Alerts       | Scrollable List | Variable-length data with mixed types, not suited to charts |

All charts use the Recharts library with consistent styling: rounded bar corners, gradient fills, custom tooltip styling, and responsive containers.
