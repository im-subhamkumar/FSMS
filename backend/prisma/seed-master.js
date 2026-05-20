// ============================================================
// FSMS — Clean Seed Script
// Wipes all tables. No dummy data.
// Admin login: admin@fsms.com / admin  (hardcoded in auth.js)
// Instructor login: their email / changeme123
// Student login: schoolEmail / set in StudentAccount
// ============================================================

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning all FSMS data...\n');

  // Delete in dependency order
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

  console.log('✅ All tables cleared. Database is clean.');
  console.log('\nLogin credentials:');
  console.log('  Admin      → admin@fsms.com / admin');
  console.log('  Instructor → <their email> / changeme123');
  console.log('  Student    → <school email> / <set in school account>');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
