// ============================================================
// Comprehensive Master Seed Script
// Integrates all modules with rich, historical 6-month data
// ============================================================

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Master Data with rich history for all FSMS Modules...\n');

  // --- 0. Clean DB ---
  console.log('Cleaning existing data...');
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.flyingSlot.deleteMany({});
  await prisma.slotRequest.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.weatherCheck.deleteMany({});
  await prisma.documentVersion.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.documentCategory.deleteMany({});
  await prisma.pricingRate.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.maintenanceActivity.deleteMany({});
  await prisma.squawk.deleteMany({});
  await prisma.aircraft.deleteMany({});
  await prisma.studentAccount.deleteMany({});
  await prisma.studentDocument.deleteMany({});
  await prisma.studentMedical.deleteMany({});
  await prisma.studentLicense.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.instructorDocument.deleteMany({});
  await prisma.instructorChangeLog.deleteMany({});
  await prisma.instructor.deleteMany({});
  await prisma.user.deleteMany({});
  
  // --- 1. Users (Admins & Staff) ---
  const admin = await prisma.user.create({
    data: { email: 'admin@fsms.in', password: 'password123', firstName: 'Super', lastName: 'Admin', role: 'ADMIN' }
  });
  const ame1 = await prisma.user.create({
    data: { email: 'ame.mehta@fsms.in', password: 'password123', firstName: 'Rahul', lastName: 'Mehta', role: 'STAFF' }
  });
  const ame2 = await prisma.user.create({
    data: { email: 'ame.nair@fsms.in', password: 'password123', firstName: 'Priya', lastName: 'Nair', role: 'STAFF' }
  });
  console.log('  [1/10] Admin and Staff users seeded');

  // --- 2. Instructors ---
  const instrUsers = [
    { email: 'capt.arora@fsms.in', firstName: 'Capt', lastName: 'Arora', role: 'INSTRUCTOR' },
    { email: 'capt.das@fsms.in', firstName: 'Capt', lastName: 'Das', role: 'INSTRUCTOR' },
    { email: 'capt.kumar@fsms.in', firstName: 'Capt', lastName: 'Kumar', role: 'INSTRUCTOR' }
  ];
  const instructors = [];
  for (let i=0; i<instrUsers.length; i++) {
    const user = await prisma.user.create({ data: { ...instrUsers[i], password: 'password123' }});
    const instr = await prisma.instructor.create({
      data: {
        userId: user.id, employeeId: `INS-00${i+1}`, designation: 'FLIGHT_INSTRUCTOR', department: 'FLYING', 
        employmentType: 'FULL_TIME', dateOfJoining: new Date('2023-01-15'), totalHours: 1500 + (i*500)
      }
    });
    instructors.push({ user, instr });
  }

  // --- 3. Rich Students Data (12 students spread across 6 months) ---
  const studentData = [
    { studentId: 'STU-001', firstName: 'Aarav',  lastName: 'Sharma',   email: 'aarav@fsms.in',  dob: new Date('2000-03-15'), gender: 'Male',   nationality: 'Indian', phone: '9876543210', batch: 'Batch-A' },
    { studentId: 'STU-002', firstName: 'Sneha',  lastName: 'Reddy',    email: 'sneha@fsms.in',  dob: new Date('2002-05-30'), gender: 'Female', nationality: 'Indian', phone: '9876543213', batch: 'Batch-A' },
    { studentId: 'STU-003', firstName: 'Vikram', lastName: 'Singh',    email: 'vikram@fsms.in', dob: new Date('2000-09-12'), gender: 'Male',   nationality: 'Indian', phone: '9876543214', batch: 'Batch-B' },
    { studentId: 'STU-004', firstName: 'Priya',  lastName: 'Patel',    email: 'priya@fsms.in',  dob: new Date('2001-07-22'), gender: 'Female', nationality: 'Indian', phone: '9876543211', batch: 'Batch-C' },
    { studentId: 'STU-005', firstName: 'Rohit',  lastName: 'Kumar',    email: 'rohit@fsms.in',  dob: new Date('1999-01-08'), gender: 'Male',   nationality: 'Indian', phone: '9876543212', batch: 'Batch-C' },
    { studentId: 'STU-006', firstName: 'Ananya', lastName: 'Gupta',    email: 'ananya@fsms.in', dob: new Date('2001-11-25'), gender: 'Female', nationality: 'Indian', phone: '9876543215', batch: 'Batch-D' },
    { studentId: 'STU-007', firstName: 'Karan',  lastName: 'Joshi',    email: 'karan@fsms.in',  dob: new Date('1998-04-17'), gender: 'Male',   nationality: 'Indian', phone: '9876543216', batch: 'Batch-D' },
    { studentId: 'STU-008', firstName: 'Meera',  lastName: 'Nair',     email: 'meera@fsms.in',  dob: new Date('2000-08-03'), gender: 'Female', nationality: 'Indian', phone: '9876543217', batch: 'Batch-E' },
    { studentId: 'STU-009', firstName: 'Arjun',  lastName: 'Mishra',   email: 'arjun@fsms.in',  dob: new Date('2001-02-14'), gender: 'Male',   nationality: 'Indian', phone: '9876543218', batch: 'Batch-E' },
    { studentId: 'STU-010', firstName: 'Divya',  lastName: 'Iyer',     email: 'divya@fsms.in',  dob: new Date('2002-06-19'), gender: 'Female', nationality: 'Indian', phone: '9876543219', batch: 'Batch-F' },
  ];
  
  const students = [];
  for (let i = 0; i < studentData.length; i++) {
    const s = studentData[i];
    // Stagger creation dates across the last 6 months for growth charts
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - (i % 6));
    
    const user = await prisma.user.create({ data: { email: s.email, password: 'password123', firstName: s.firstName, lastName: s.lastName, role: 'STUDENT' }});
    const stu = await prisma.student.create({ data: { ...s, createdAt } });
    students.push({ user, stu });
  }
  console.log(`  [2/10] Instructors and ${students.length} Students seeded`);

  // --- 4. Aircraft & Maintenance ---
  const aircraftData = [
    { id: 'VT-BXA', tailNumber: 'VT-BXA', name: 'Cessna 172 Skyhawk', model: '172S', status: 'Active', maintenanceStatus: 'AOG', assignedAmeId: ame1.id, totalFlightHours: 4218 },
    { id: 'VT-MKJ', tailNumber: 'VT-MKJ', name: 'Cessna 172 Skyhawk', model: '172S', status: 'Active', maintenanceStatus: 'AIRWORTHY', assignedAmeId: ame2.id, totalFlightHours: 3901 },
    { id: 'VT-PRA', tailNumber: 'VT-PRA', name: 'Piper PA-28', model: 'PA-28', status: 'Active', maintenanceStatus: 'IN_MAINTENANCE', assignedAmeId: ame1.id, totalFlightHours: 2540 },
    { id: 'VT-DEF', tailNumber: 'VT-DEF', name: 'Diamond DA40', model: 'DA40', status: 'Active', maintenanceStatus: 'AIRWORTHY', assignedAmeId: ame2.id, totalFlightHours: 1200 }
  ];
  for (const ac of aircraftData) {
    await prisma.aircraft.create({ data: ac });
  }

  await prisma.squawk.createMany({
    data: [
      { aircraftId: 'VT-BXA', issue: 'Left brake feels soft on rollout', severity: 'Critical', status: 'Open', reportedById: instructors[0].user.id },
      { aircraftId: 'VT-PRA', issue: 'Unusual vibration above 2,500 RPM', severity: 'Major', status: 'In Progress', reportedById: instructors[1].user.id }
    ]
  });

  await prisma.maintenanceActivity.createMany({
    data: [
      { description: 'Resolved left brake issue on VT-BXA.', type: 'Complete', userId: ame1.id },
      { description: 'Routine 50-hour inspection started for VT-PRA.', type: 'Alert', userId: ame2.id }
    ]
  });
  console.log('  [3/10] Aircraft & Maintenance seeded');

  // --- 5. Courses & Pricing Rates ---
  const courses = [
    { code: 'PPL-01', name: 'Private Pilot License', level: 'PPL', durationHours: 45, price: 400000 },
    { code: 'CPL-01', name: 'Commercial Pilot License', level: 'CPL', durationHours: 200, price: 2500000 },
    { code: 'IFR-01', name: 'Instrument Rating', level: 'IFR', durationHours: 50, price: 500000 },
    { code: 'ME-01',  name: 'Multi-Engine Rating', level: 'MULTI_ENGINE', durationHours: 25, price: 300000 },
    { code: 'ATPL-01',name: 'Airline Transport Pilot', level: 'ATPL', durationHours: 250, price: 4000000 }
  ];
  const courseMap = {};
  for (const c of courses) {
    courseMap[c.code] = await prisma.course.create({ data: { ...c, createdBy: admin.id }});
  }

  // Generic Rates
  await prisma.pricingRate.createMany({
    data: [
      { name: 'Cessna 172 Rental', category: 'AIRCRAFT_RENTAL', rateType: 'HOURLY', amount: 8000, createdBy: admin.id },
      { name: 'Piper PA-28 Rental', category: 'AIRCRAFT_RENTAL', rateType: 'HOURLY', amount: 9500, createdBy: admin.id },
      { name: 'Diamond DA40 Rental', category: 'AIRCRAFT_RENTAL', rateType: 'HOURLY', amount: 12000, createdBy: admin.id },
      { name: 'Flight Instructor Fee', category: 'INSTRUCTOR_FEE', rateType: 'HOURLY', amount: 3000, createdBy: admin.id },
      { name: 'DGCA Exam Fee', category: 'EXAM_FEE', rateType: 'FLAT', amount: 5000, createdBy: admin.id }
    ]
  });
  // Linked Rates
  for (const code of Object.keys(courseMap)) {
    const c = courseMap[code];
    await prisma.pricingRate.create({
      data: { name: `${c.code} Base Fee`, category: 'COURSE_FEE', rateType: 'FLAT', amount: c.price, courseId: c.id, createdBy: admin.id }
    });
  }
  console.log('  [4/10] Courses & Pricing seeded');

  // --- 6. Rich Flying Slots (6 months history) ---
  const slotStatuses = ['SCHEDULED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED'];
  const slotTimes = [{ start: '06:00', end: '08:00' }, { start: '08:30', end: '10:30' }, { start: '11:00', end: '13:00' }, { start: '14:00', end: '16:00' }];
  const aircraftRegs = aircraftData.map(a => a.tailNumber);

  let slotCount = 0;
  for (let m = 0; m <= 6; m++) {
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() - m);
    const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
    const slotsThisMonth = 15 + Math.floor(Math.random() * 15); // 15-30 slots per month

    for (let s = 0; s < slotsThisMonth; s++) {
      const day = 1 + Math.floor(Math.random() * daysInMonth);
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), day);
      
      // If date is in the future relative to today, make it mostly SCHEDULED
      let status = slotStatuses[Math.floor(Math.random() * slotStatuses.length)];
      if (date > new Date()) status = 'SCHEDULED';

      const time = slotTimes[s % slotTimes.length];

      await prisma.flyingSlot.create({
        data: {
          date, startTime: time.start, endTime: time.end, status,
          aircraft: aircraftRegs[s % aircraftRegs.length],
          studentId: students[s % students.length].user.id,
          instructorId: instructors[s % instructors.length].user.id,
        },
      });
      slotCount++;
    }
  }
  
  await prisma.slotRequest.createMany({
    data: [
      { date: new Date(new Date().setDate(new Date().getDate() + 2)), timePreference: 'Morning', instructorPreference: 'Capt Arora', aircraftPreference: 'VT-MKJ', studentId: students[1].user.id, status: 'PENDING' },
      { date: new Date(new Date().setDate(new Date().getDate() + 3)), timePreference: 'Afternoon', instructorPreference: 'Any', aircraftPreference: 'Cessna 172', studentId: students[2].user.id, status: 'APPROVED' }
    ]
  });
  console.log(`  [5/10] Flying Slots (${slotCount}) & Requests seeded`);

  // --- 7. Schedules & Weather ---
  const today = new Date();
  await prisma.schedule.createMany({
    data: [
      { traineeId: students[0].stu.id, traineeName: 'Aarav Sharma', instructorId: instructors[0].instr.id, instructorName: 'Capt Arora', aircraftId: 'VT-MKJ', startTime: new Date(today.setHours(9,0,0,0)), endTime: new Date(today.setHours(11,0,0,0)), status: 'SCHEDULED', weatherVerdict: 'GO' },
      { traineeId: students[1].stu.id, traineeName: 'Sneha Reddy', instructorId: instructors[1].instr.id, instructorName: 'Capt Das', aircraftId: 'VT-PRA', startTime: new Date(today.setHours(13,0,0,0)), endTime: new Date(today.setHours(15,0,0,0)), status: 'CANCELLED', cancellationReason: 'Aircraft in Maintenance', weatherVerdict: 'NO-GO' }
    ]
  });
  await prisma.weatherCheck.createMany({
    data: [
      { icao: 'VIDP', stationName: 'Indira Gandhi Intl', studentType: 'SPL', verdict: 'NO-GO', windSpeed: 25, visibilitySm: 2.0, ceilingFt: 800, temperatureC: 28, reasons: 'Visibility too low for SPL. Wind exceeds limit.', warnings: 'Gusts up to 35kts' },
      { icao: 'VABB', stationName: 'Chhatrapati Shivaji Intl', studentType: 'CPL', verdict: 'GO', windSpeed: 10, visibilitySm: 10.0, ceilingFt: 3500, temperatureC: 32 }
    ]
  });
  console.log('  [6/10] Schedules & Weather seeded');

  // --- 8. Documents, Licenses, Medicals ---
  const cat1 = await prisma.documentCategory.create({ data: { name: 'Medical Certificates', requiresExpiry: true, warningThresholdDays: 30 }});
  const cat2 = await prisma.documentCategory.create({ data: { name: 'Training Manuals', requiresExpiry: false }});

  // Seed some expiring and expired documents/licenses for Compliance Alerts
  const now = new Date();
  const expiredDate = new Date(now); expiredDate.setDate(now.getDate() - 5);
  const expiringDate = new Date(now); expiringDate.setDate(now.getDate() + 15);
  const validDate = new Date(now); validDate.setFullYear(validDate.getFullYear() + 1);

  await prisma.studentLicense.create({ data: { studentId: students[0].stu.id, licenseNumber: 'SPL-001', licenseType: 'SPL', issueDate: new Date('2022-01-01'), expiryDate: expiringDate }});
  await prisma.studentLicense.create({ data: { studentId: students[1].stu.id, licenseNumber: 'PPL-002', licenseType: 'PPL', issueDate: new Date('2020-05-10'), expiryDate: expiredDate }});
  
  await prisma.studentMedical.create({ data: { studentId: students[2].stu.id, medicalCertificateNumber: 'MED-003', issueDate: new Date('2023-01-01'), expiryDate: expiringDate }});
  await prisma.studentMedical.create({ data: { studentId: students[3].stu.id, medicalCertificateNumber: 'MED-004', issueDate: new Date('2023-01-01'), expiryDate: validDate }});

  const doc1 = await prisma.document.create({ data: { title: 'Class 1 Medical - Rohit', categoryId: cat1.id, studentId: students[4].user.id, expiryDate: expiredDate, status: 'ACTIVE' } });
  await prisma.documentVersion.create({ data: { documentId: doc1.id, fileUrl: 'medical_rohit.pdf', originalName: 'medical_rohit.pdf', mimeType: 'application/pdf', size: 1024000 } });
  const doc2 = await prisma.document.create({ data: { title: 'Cessna 172 POH', categoryId: cat2.id, aircraftId: 'VT-MKJ', status: 'ACTIVE' } });
  await prisma.documentVersion.create({ data: { documentId: doc2.id, fileUrl: 'cessna_poh.pdf', originalName: 'cessna_poh.pdf', mimeType: 'application/pdf', size: 5000000 } });
  console.log('  [7/10] Documents & Compliance seeded');

  // --- 9. Rich Invoices & Payments (T3 Dashboard Specific) ---
  const billingPlan = [
    { courseCode: 'PPL-01', status: 'PAID',    month: -5, flyHrs: 20, aircraft: 'VT-BXA', acRate: 8000, instrRate: 3000 },
    { courseCode: 'IFR-01', status: 'PAID',    month: -4, flyHrs: 15, aircraft: 'VT-MKJ', acRate: 8000, instrRate: 3000 },
    { courseCode: 'CPL-01', status: 'PAID',    month: -4, flyHrs: 10, aircraft: 'VT-PRA', acRate: 9500, instrRate: 3000 },
    { courseCode: 'PPL-01', status: 'PAID',    month: -3, flyHrs: 18, aircraft: 'VT-BXA', acRate: 8000, instrRate: 3000 },
    { courseCode: 'ME-01',  status: 'PAID',    month: -3, flyHrs: 12, aircraft: 'VT-DEF', acRate: 12000, instrRate: 3000 },
    { courseCode: 'ATPL-01',status: 'PAID',    month: -2, flyHrs: 0,  aircraft: null,     acRate: 0,    instrRate: 0 },
    { courseCode: 'CPL-01', status: 'PAID',    month: -2, flyHrs: 25, aircraft: 'VT-BXA', acRate: 8000, instrRate: 3000 },
    { courseCode: 'IFR-01', status: 'PAID',    month: -1, flyHrs: 20, aircraft: 'VT-PRA', acRate: 9500, instrRate: 3000 },
    { courseCode: 'CPL-01', status: 'PENDING', month: -1, flyHrs: 30, aircraft: 'VT-BXA', acRate: 8000, instrRate: 3000, paidPct: 0 },
    { courseCode: 'PPL-01', status: 'PENDING', month: 0,  flyHrs: 10, aircraft: 'VT-MKJ', acRate: 8000, instrRate: 3000, paidPct: 0.3 },
    { courseCode: 'ATPL-01',status: 'PENDING', month: 0,  flyHrs: 0,  aircraft: null,     acRate: 0,    instrRate: 0,   paidPct: 0.1 },
    { courseCode: 'IFR-01', status: 'OVERDUE', month: -3, flyHrs: 15, aircraft: 'VT-DEF', acRate: 12000, instrRate: 3000, paidPct: 0 },
    { courseCode: 'PPL-01', status: 'OVERDUE', month: -2, flyHrs: 22, aircraft: 'VT-BXA', acRate: 8000,  instrRate: 3000, paidPct: 0.2 },
    // Add some recent ones for default 30-day view
    { courseCode: 'CPL-01', status: 'PAID',    month: 0,  flyHrs: 15, aircraft: 'VT-PRA', acRate: 9500,  instrRate: 3000 },
    { courseCode: 'ME-01',  status: 'PAID',    month: 0,  flyHrs: 5,  aircraft: 'VT-DEF', acRate: 12000, instrRate: 3000 },
  ];

  let invoiceSeq = 1;
  for (let i = 0; i < billingPlan.length; i++) {
    const bp = billingPlan[i];
    const course = courseMap[bp.courseCode];
    const student = students[i % students.length];

    const issuedDate = new Date();
    issuedDate.setMonth(issuedDate.getMonth() + bp.month);
    issuedDate.setDate(5 + (i % 20)); // distribute days
    
    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const items = [];
    items.push({ description: `${bp.courseCode} — ${course.name} (Course Fee)`, quantity: 1, unitPrice: Number(course.price), totalPrice: Number(course.price) });
    if (bp.flyHrs > 0 && bp.aircraft) {
      items.push({ description: `${bp.aircraft} Rental — ${bp.flyHrs} hrs`, quantity: bp.flyHrs, unitPrice: bp.acRate, totalPrice: bp.flyHrs * bp.acRate });
      items.push({ description: `Flight Instructor Fee — ${bp.flyHrs} hrs`, quantity: bp.flyHrs, unitPrice: bp.instrRate, totalPrice: bp.flyHrs * bp.instrRate });
    }
    if (['PPL-01', 'CPL-01'].includes(bp.courseCode)) {
      items.push({ description: 'DGCA Written Exam Fee', quantity: 1, unitPrice: 5000, totalPrice: 5000 });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const paidPct = bp.status === 'PAID' ? 1.0 : (bp.paidPct || 0);
    const paidAmount = Math.round(totalAmount * paidPct);

    const createdInv = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-${String(invoiceSeq++).padStart(4, '0')}`,
        studentId: student.stu.id, issuedById: admin.id, status: bp.status,
        amount: totalAmount, paidAmount, issuedDate, dueDate,
        items: { create: items }
      }
    });

    if (paidAmount > 0) {
      await prisma.payment.create({
        data: { invoiceId: createdInv.id, amount: paidAmount, method: 'Bank Transfer', paidAt: new Date(issuedDate.getTime() + 86400000) }
      });
    }
  }
  console.log('  [8/10] Invoices & Payments seeded');

  console.log('\n✅ Master Seeding Complete! All modules and dashboards are now fully populated.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
