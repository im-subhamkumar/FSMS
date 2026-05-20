// ============================================================
// Seed script — realistic, interlinked demo data for Invoices & Report Dashboard
// Run: docker exec fsms_backend node prisma/seed-t3.js
//
// Data flow: Course → PricingRate → InvoiceItem → Invoice
//            Student → FlyingSlot (with Instructor + Aircraft)
// ============================================================

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding interlinked demo data for Invoices & Report Dashboard...\n');

  // ── 1. Students ──────────────────────────────────────────
  const studentData = [
    { studentId: 'STU-001', firstName: 'Aarav',  lastName: 'Sharma',   email: 'aarav@fsms.in',  dob: new Date('2000-03-15'), gender: 'Male',   nationality: 'Indian', phone: '9876543210', batch: 'Batch-A', createdAt: new Date('2025-11-10') },
    { studentId: 'STU-002', firstName: 'Priya',  lastName: 'Patel',    email: 'priya@fsms.in',  dob: new Date('2001-07-22'), gender: 'Female', nationality: 'Indian', phone: '9876543211', batch: 'Batch-A', createdAt: new Date('2025-11-20') },
    { studentId: 'STU-003', firstName: 'Rohit',  lastName: 'Kumar',    email: 'rohit@fsms.in',  dob: new Date('1999-01-08'), gender: 'Male',   nationality: 'Indian', phone: '9876543212', batch: 'Batch-B', createdAt: new Date('2025-12-05') },
    { studentId: 'STU-004', firstName: 'Sneha',  lastName: 'Reddy',    email: 'sneha@fsms.in',  dob: new Date('2002-05-30'), gender: 'Female', nationality: 'Indian', phone: '9876543213', batch: 'Batch-B', createdAt: new Date('2025-12-18') },
    { studentId: 'STU-005', firstName: 'Vikram', lastName: 'Singh',    email: 'vikram@fsms.in', dob: new Date('2000-09-12'), gender: 'Male',   nationality: 'Indian', phone: '9876543214', batch: 'Batch-C', createdAt: new Date('2026-01-10') },
    { studentId: 'STU-006', firstName: 'Ananya', lastName: 'Gupta',    email: 'ananya@fsms.in', dob: new Date('2001-11-25'), gender: 'Female', nationality: 'Indian', phone: '9876543215', batch: 'Batch-C', createdAt: new Date('2026-01-25') },
    { studentId: 'STU-007', firstName: 'Karan',  lastName: 'Joshi',    email: 'karan@fsms.in',  dob: new Date('1998-04-17'), gender: 'Male',   nationality: 'Indian', phone: '9876543216', batch: 'Batch-D', createdAt: new Date('2026-02-08') },
    { studentId: 'STU-008', firstName: 'Meera',  lastName: 'Nair',     email: 'meera@fsms.in',  dob: new Date('2000-08-03'), gender: 'Female', nationality: 'Indian', phone: '9876543217', batch: 'Batch-D', createdAt: new Date('2026-02-20') },
    { studentId: 'STU-009', firstName: 'Arjun',  lastName: 'Mishra',   email: 'arjun@fsms.in',  dob: new Date('2001-02-14'), gender: 'Male',   nationality: 'Indian', phone: '9876543218', batch: 'Batch-E', createdAt: new Date('2026-03-05') },
    { studentId: 'STU-010', firstName: 'Divya',  lastName: 'Iyer',     email: 'divya@fsms.in',  dob: new Date('2002-06-19'), gender: 'Female', nationality: 'Indian', phone: '9876543219', batch: 'Batch-E', createdAt: new Date('2026-03-18') },
    { studentId: 'STU-011', firstName: 'Nikhil', lastName: 'Desai',    email: 'nikhil@fsms.in', dob: new Date('1999-10-28'), gender: 'Male',   nationality: 'Indian', phone: '9876543220', batch: 'Batch-F', createdAt: new Date('2026-04-02') },
    { studentId: 'STU-012', firstName: 'Riya',   lastName: 'Banerjee', email: 'riya@fsms.in',   dob: new Date('2000-12-07'), gender: 'Female', nationality: 'Indian', phone: '9876543221', batch: 'Batch-F', createdAt: new Date('2026-04-15') },
  ];

  for (const s of studentData) {
    await prisma.student.upsert({ where: { studentId: s.studentId }, update: {}, create: s });
  }
  console.log('  [1/6] Students seeded: 12');

  // ── 2. Courses ───────────────────────────────────────────
  const courseData = [
    { code: 'PPL-01',  name: 'Private Pilot License',           level: 'PPL',           durationHours: 45,  price: 350000 },
    { code: 'CPL-01',  name: 'Commercial Pilot License',        level: 'CPL',           durationHours: 200, price: 2500000 },
    { code: 'IFR-01',  name: 'Instrument Flight Rating',        level: 'IFR',           durationHours: 50,  price: 500000 },
    { code: 'PPL-02',  name: 'PPL Ground School',               level: 'GROUND_SCHOOL', durationHours: 80,  price: 120000 },
    { code: 'CPL-02',  name: 'CPL Advanced Navigation',         level: 'CPL',           durationHours: 60,  price: 450000 },
    { code: 'ATPL-01', name: 'Airline Transport Pilot License',  level: 'ATPL',          durationHours: 250, price: 4000000 },
    { code: 'ME-01',   name: 'Multi-Engine Rating',              level: 'MULTI_ENGINE',  durationHours: 25,  price: 300000 },
  ];

  const courseMap = {};
  for (const c of courseData) {
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: { ...c, isActive: true, createdBy: 1 },
    });
    courseMap[c.code] = course;
  }
  console.log('  [2/6] Courses seeded: 7');

  // ── 3. Pricing Rates (linked to courses) ─────────────────
  // Clear old pricing rates first
  await prisma.pricingRate.deleteMany({});

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const creatorId = adminUser?.id || 1;

  // Course fees — one per course
  for (const c of courseData) {
    await prisma.pricingRate.create({
      data: {
        name: `${c.code} — Course Fee`,
        category: 'COURSE_FEE',
        rateType: 'FLAT',
        amount: c.price,
        courseId: courseMap[c.code].id,
        isActive: true,
        createdBy: creatorId,
      },
    });
  }

  // Aircraft rental rates (hourly)
  const aircraftRates = [
    { name: 'Cessna 172 — Rental', aircraft: 'VT-ABC', amount: 8000 },
    { name: 'Diamond DA40 — Rental', aircraft: 'VT-DEF', amount: 12000 },
    { name: 'Piper PA28 — Rental', aircraft: 'VT-GHI', amount: 9500 },
    { name: 'Cessna 152 — Rental', aircraft: 'VT-JKL', amount: 6500 },
  ];
  for (const ar of aircraftRates) {
    await prisma.pricingRate.create({
      data: {
        name: ar.name,
        category: 'AIRCRAFT_RENTAL',
        rateType: 'HOURLY',
        amount: ar.amount,
        isActive: true,
        createdBy: creatorId,
      },
    });
  }

  // Instructor fee rates (hourly)
  const instrRates = [
    { name: 'Flight Instructor Fee', amount: 3000 },
    { name: 'Ground Instructor Fee', amount: 1500 },
    { name: 'Simulator Instructor Fee', amount: 2000 },
  ];
  for (const ir of instrRates) {
    await prisma.pricingRate.create({
      data: {
        name: ir.name,
        category: 'INSTRUCTOR_FEE',
        rateType: 'HOURLY',
        amount: ir.amount,
        isActive: true,
        createdBy: creatorId,
      },
    });
  }

  // Exam fees
  await prisma.pricingRate.create({
    data: {
      name: 'DGCA Written Exam Fee',
      category: 'EXAM_FEE',
      rateType: 'FLAT',
      amount: 5000,
      isActive: true,
      createdBy: creatorId,
    },
  });

  console.log('  [3/6] PricingRates seeded: 15');

  // ── 4. Instructor & Student Users ────────────────────────
  const instructorUsers = [
    { email: 'capt.arora@fsms.in', firstName: 'Capt Arora', lastName: '', role: 'INSTRUCTOR' },
    { email: 'capt.mehta@fsms.in', firstName: 'Capt Mehta', lastName: '', role: 'INSTRUCTOR' },
    { email: 'capt.das@fsms.in',   firstName: 'Capt Das',   lastName: '', role: 'INSTRUCTOR' },
  ];

  const instrIds = [];
  for (const u of instructorUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: 'hashed_placeholder', isActive: true },
    });
    instrIds.push(user.id);
  }

  const studentUsers = [
    { email: 'stu.aarav@fsms.in',  firstName: 'Aarav',  lastName: 'Sharma', role: 'STUDENT' },
    { email: 'stu.priya@fsms.in',  firstName: 'Priya',  lastName: 'Patel',  role: 'STUDENT' },
    { email: 'stu.rohit@fsms.in',  firstName: 'Rohit',  lastName: 'Kumar',  role: 'STUDENT' },
    { email: 'stu.sneha@fsms.in',  firstName: 'Sneha',  lastName: 'Reddy',  role: 'STUDENT' },
  ];

  const stuUserIds = [];
  for (const u of studentUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: 'hashed_placeholder', isActive: true },
    });
    stuUserIds.push(user.id);
  }

  // Instructors table
  for (let i = 0; i < instrIds.length; i++) {
    const existing = await prisma.instructor.findFirst({ where: { userId: instrIds[i] } });
    if (!existing) {
      await prisma.instructor.create({
        data: {
          userId: instrIds[i],
          employeeId: `INS-${String(i + 1).padStart(3, '0')}`,
          designation: 'FLIGHT_INSTRUCTOR',
          department: 'FLYING',
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
          totalHours: [1200, 850, 600][i],
          dateOfJoining: new Date('2024-01-15'),
        },
      });
    }
  }
  console.log('  [4/6] Users + Instructors seeded');

  // ── 5. Flying Slots (spread across 6 months) ────────────
  const slotStatuses = ['SCHEDULED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED'];
  const slotTimes = [
    { start: '06:00', end: '08:00' },
    { start: '08:30', end: '10:30' },
    { start: '11:00', end: '13:00' },
    { start: '14:00', end: '16:00' },
  ];
  const aircraftRegs = ['VT-ABC', 'VT-DEF', 'VT-GHI', 'VT-JKL'];

  let slotCount = 0;
  for (let m = 0; m < 6; m++) {
    const baseDate = new Date(2026, 4 - m, 1);
    const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
    const slotsThisMonth = 8 + Math.floor(Math.random() * 8);

    for (let s = 0; s < slotsThisMonth; s++) {
      const day = 1 + Math.floor(Math.random() * Math.min(daysInMonth, 28));
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), day);
      const time = slotTimes[s % slotTimes.length];
      const status = slotStatuses[Math.floor(Math.random() * slotStatuses.length)];

      await prisma.flyingSlot.create({
        data: {
          date,
          startTime: time.start,
          endTime: time.end,
          status,
          aircraft: aircraftRegs[s % aircraftRegs.length],
          studentId: stuUserIds[s % stuUserIds.length],
          instructorId: instrIds[s % instrIds.length],
        },
      });
      slotCount++;
    }
  }
  console.log(`  [5/6] Flying slots seeded: ${slotCount}`);

  // ── 6. Invoices (realistic, course-linked billing) ───────
  // Delete old seeded invoices (keep any user-created ones)
  const oldSeeded = await prisma.invoice.findMany({
    where: { invoiceNumber: { startsWith: 'INV-2026-' } },
    select: { id: true },
  });
  if (oldSeeded.length > 0) {
    for (const inv of oldSeeded) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: inv.id } });
      await prisma.payment.deleteMany({ where: { invoiceId: inv.id } });
    }
    await prisma.invoice.deleteMany({
      where: { id: { in: oldSeeded.map(i => i.id) } },
    });
  }

  const students = await prisma.student.findMany({ take: 12 });
  const issuerId = creatorId;

  // Realistic billing: each invoice ties to a course + hourly rates
  const billingPlan = [
    // PAID — Course Fee + Aircraft + Instructor (completed training)
    { courseCode: 'PPL-01', status: 'PAID',    month: -5, flyHrs: 20, aircraft: 'VT-ABC', acRate: 8000, instrRate: 3000 },
    { courseCode: 'PPL-02', status: 'PAID',    month: -5, flyHrs: 0,  aircraft: null,     acRate: 0,    instrRate: 0 },
    { courseCode: 'IFR-01', status: 'PAID',    month: -4, flyHrs: 15, aircraft: 'VT-DEF', acRate: 12000, instrRate: 3000 },
    { courseCode: 'CPL-02', status: 'PAID',    month: -4, flyHrs: 10, aircraft: 'VT-GHI', acRate: 9500, instrRate: 3000 },
    { courseCode: 'PPL-01', status: 'PAID',    month: -3, flyHrs: 18, aircraft: 'VT-ABC', acRate: 8000, instrRate: 3000 },
    { courseCode: 'ME-01',  status: 'PAID',    month: -3, flyHrs: 12, aircraft: 'VT-DEF', acRate: 12000, instrRate: 3000 },
    { courseCode: 'PPL-02', status: 'PAID',    month: -2, flyHrs: 0,  aircraft: null,     acRate: 0,    instrRate: 0 },
    { courseCode: 'CPL-01', status: 'PAID',    month: -2, flyHrs: 25, aircraft: 'VT-ABC', acRate: 8000, instrRate: 3000 },
    { courseCode: 'IFR-01', status: 'PAID',    month: -1, flyHrs: 20, aircraft: 'VT-GHI', acRate: 9500, instrRate: 3000 },
    // PENDING — Partial or no payment
    { courseCode: 'CPL-01', status: 'PENDING', month: -1, flyHrs: 30, aircraft: 'VT-ABC', acRate: 8000, instrRate: 3000, paidPct: 0 },
    { courseCode: 'PPL-01', status: 'PENDING', month: 0,  flyHrs: 10, aircraft: 'VT-JKL', acRate: 6500, instrRate: 3000, paidPct: 0.3 },
    { courseCode: 'ATPL-01', status: 'PENDING', month: 0, flyHrs: 0,  aircraft: null,     acRate: 0,    instrRate: 0,   paidPct: 0.1 },
    // OVERDUE
    { courseCode: 'CPL-02', status: 'OVERDUE', month: -3, flyHrs: 15, aircraft: 'VT-DEF', acRate: 12000, instrRate: 3000, paidPct: 0 },
    { courseCode: 'PPL-01', status: 'OVERDUE', month: -2, flyHrs: 22, aircraft: 'VT-ABC', acRate: 8000,  instrRate: 3000, paidPct: 0.2 },
  ];

  let invoiceSeq = 1;
  for (let i = 0; i < billingPlan.length; i++) {
    const bp = billingPlan[i];
    const course = courseMap[bp.courseCode];
    const student = students[i % students.length];

    const issuedDate = new Date();
    issuedDate.setMonth(issuedDate.getMonth() + bp.month);
    issuedDate.setDate(5 + (i % 20));

    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Build line items
    const items = [];

    // Item 1: Course Fee (always present)
    items.push({
      description: `${bp.courseCode} — ${course.name} (Course Fee)`,
      quantity: 1,
      unitPrice: Number(course.price),
      totalPrice: Number(course.price),
    });

    // Item 2: Aircraft Rental (if flyHrs > 0)
    if (bp.flyHrs > 0 && bp.aircraft) {
      const acName = aircraftRates.find(a => a.aircraft === bp.aircraft)?.name || bp.aircraft;
      items.push({
        description: `${acName} — ${bp.flyHrs} hrs`,
        quantity: bp.flyHrs,
        unitPrice: bp.acRate,
        totalPrice: bp.flyHrs * bp.acRate,
      });
    }

    // Item 3: Instructor Fee (if flyHrs > 0)
    if (bp.flyHrs > 0) {
      items.push({
        description: `Flight Instructor Fee — ${bp.flyHrs} hrs`,
        quantity: bp.flyHrs,
        unitPrice: bp.instrRate,
        totalPrice: bp.flyHrs * bp.instrRate,
      });
    }

    // Item 4: Exam fee for PPL/CPL courses
    if (['PPL-01', 'CPL-01'].includes(bp.courseCode)) {
      items.push({
        description: 'DGCA Written Exam Fee',
        quantity: 1,
        unitPrice: 5000,
        totalPrice: 5000,
      });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const paidPct = bp.status === 'PAID' ? 1.0 : (bp.paidPct || 0);
    const paidAmount = Math.round(totalAmount * paidPct);

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-${String(invoiceSeq++).padStart(4, '0')}`,
        studentId: student.id,
        issuedById: issuerId,
        status: bp.status,
        amount: totalAmount,
        paidAmount: paidAmount,
        issuedDate,
        dueDate,
        notes: `Training billing for ${course.name}`,
        items: { create: items },
      },
    });
  }
  console.log(`  [6/6] Invoices seeded: ${billingPlan.length} (with ${billingPlan.reduce((s, b) => s + 1 + (b.flyHrs > 0 ? 2 : 0) + (['PPL-01','CPL-01'].includes(b.courseCode) ? 1 : 0), 0)} line items)`);

  // ── 7. Aircraft & Maintenance ──────────────────────────────
  const aircraftData = [
    { id: 'AC-1001', tailNumber: 'VT-ABC', name: 'Cessna 172 Skyhawk', model: '172S', manufacturer: 'Cessna', yearOfManufacture: 2015, status: 'Active', availability: 'Available', type: 'Trainer' },
    { id: 'AC-1002', tailNumber: 'VT-DEF', name: 'Diamond DA40', model: 'DA40', manufacturer: 'Diamond', yearOfManufacture: 2018, status: 'Active', availability: 'Available', type: 'Trainer' },
    { id: 'AC-1003', tailNumber: 'VT-GHI', name: 'Piper PA28', model: 'PA28', manufacturer: 'Piper', yearOfManufacture: 2012, status: 'Active', availability: 'Available', type: 'Trainer' },
    { id: 'AC-1004', tailNumber: 'VT-JKL', name: 'Cessna 152', model: '152', manufacturer: 'Cessna', yearOfManufacture: 2008, status: 'In_Maintenance', availability: 'Unavailable', type: 'Trainer' },
  ];
  for (const ac of aircraftData) {
    await prisma.aircraft.upsert({ where: { id: ac.id }, update: {}, create: ac });
  }

  await prisma.squawk.createMany({
    data: [
      { aircraftId: 'AC-1001', issue: 'Right main tire worn', severity: 'Normal', status: 'Open' },
      { aircraftId: 'AC-1004', issue: '100-hour inspection due', severity: 'High', status: 'Open' }
    ]
  });
  console.log('  [7/10] Aircraft & Squawks seeded');

  // ── 8. Documents & Categories ───────────────────────────────
  const cat1 = await prisma.documentCategory.upsert({ where: { name: 'Training Manuals' }, update: {}, create: { name: 'Training Manuals' } });
  const cat2 = await prisma.documentCategory.upsert({ where: { name: 'Medical Certificates' }, update: {}, create: { name: 'Medical Certificates', requiresExpiry: true } });

  await prisma.document.create({
    data: {
      title: 'Cessna 172 POH', categoryId: cat1.id, status: 'ACTIVE',
      versions: { create: [{ originalName: 'C172_POH.pdf', fileUrl: 'https://example.com/c172.pdf', mimeType: 'application/pdf', size: 1024000 }] }
    }
  });
  console.log('  [8/10] Documents seeded');

  // ── 9. Student Details ──────────────────────────────────────
  if (students.length >= 2) {
    await prisma.studentLicense.create({ data: { studentId: students[0].id, licenseNumber: 'SPL-001', licenseType: 'SPL', issueDate: new Date('2025-11-15'), expiryDate: new Date('2027-11-15') }});
    await prisma.studentMedical.create({ data: { studentId: students[0].id, medicalCertificateNumber: 'MED-001', issueDate: new Date('2025-11-15'), expiryDate: new Date('2026-11-15') }});
    
    await prisma.studentLicense.create({ data: { studentId: students[1].id, licenseNumber: 'PPL-002', licenseType: 'PPL', issueDate: new Date('2024-05-10'), expiryDate: new Date('2029-05-10') }});
    await prisma.studentMedical.create({ data: { studentId: students[1].id, medicalCertificateNumber: 'MED-002', issueDate: new Date('2024-05-10'), expiryDate: new Date('2025-05-10') }});
  }
  console.log('  [9/10] Student Licenses/Medicals seeded');

  // ── 10. Schedules & Weather ─────────────────────────────────
  const recentSlots = await prisma.flyingSlot.findMany({ take: 5, include: { student: true, instructor: true } });
  for (const s of recentSlots) {
    const sDate = new Date(s.date);
    // Rough estimate for startTime/endTime
    sDate.setHours(8, 0, 0); 
    const eDate = new Date(s.date);
    eDate.setHours(10, 0, 0);

    await prisma.schedule.create({
      data: {
        traineeId: s.studentId, traineeName: `${s.student.firstName} ${s.student.lastName}`,
        instructorId: s.instructorId, instructorName: `${s.instructor.firstName} ${s.instructor.lastName}`,
        aircraftId: s.aircraft || 'VT-ABC', startTime: sDate, endTime: eDate, status: s.status
      }
    });
  }
  
  await prisma.weatherCheck.create({ data: { icao: 'VIDP', verdict: 'GO', flightCategory: 'VFR', temperatureC: 25, checkedBy: 'system' } });
  console.log('  [10/10] Schedules & Weather seeded');

  console.log('\nDone! Database now has rich, comprehensive data across all interconnected modules.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
