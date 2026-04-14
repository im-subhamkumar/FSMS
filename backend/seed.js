import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding DocumentCategories...');
  await prisma.documentCategory.createMany({
    data: [
      { name: 'License', description: 'Pilot Licenses', requiresExpiry: true, warningThresholdDays: 60 },
      { name: 'Medical', description: 'Medical Certificates', requiresExpiry: true, warningThresholdDays: 30 },
      { name: 'Logbook', description: 'Flight Logs', requiresExpiry: false, warningThresholdDays: 0 },
      { name: 'Certificate', description: 'Training Certificates', requiresExpiry: false, warningThresholdDays: 0 }
    ],
    skipDuplicates: true
  });
  console.log('Done!');
}
seed().catch(console.error).finally(() => prisma.$disconnect());
