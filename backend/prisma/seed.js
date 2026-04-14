import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create a dummy admin/staff member (AME)
  const ameUser1 = await prisma.user.upsert({
    where: { email: 'ame.mehta@fsms.com' },
    update: {},
    create: {
      email: 'ame.mehta@fsms.com',
      password: 'password123',
      firstName: 'Rahul',
      lastName: 'Mehta',
      role: 'STAFF',
    },
  });

  const ameUser2 = await prisma.user.upsert({
    where: { email: 'ame.nair@fsms.com' },
    update: {},
    create: {
      email: 'ame.nair@fsms.com',
      password: 'password123',
      firstName: 'Priya',
      lastName: 'Nair',
      role: 'STAFF',
    },
  });

  // 2. Create Aircraft
  const aircraftData = [
    { tailNumber: 'VT-BXA', type: 'Cessna 172S', hours: 4218, nextCheck: 8, status: 'AOG', assignedAmeId: ameUser1.id },
    { tailNumber: 'VT-MKJ', type: 'Cessna 172S', hours: 3901, nextCheck: 14, status: 'AIRWORTHY', assignedAmeId: ameUser2.id },
    { tailNumber: 'VT-PRA', type: 'Piper PA-28', hours: 2540, nextCheck: 31, status: 'AIRWORTHY', assignedAmeId: ameUser1.id },
    { tailNumber: 'VT-KLM', type: 'Cessna 152', hours: 1780, nextCheck: 22, status: 'AIRWORTHY' },
    { tailNumber: 'VT-SNA', type: 'Piper PA-28', hours: 3102, nextCheck: 44, status: 'IN_MAINTENANCE', assignedAmeId: ameUser2.id },
  ];

  for (const ac of aircraftData) {
    await prisma.aircraft.upsert({
      where: { tailNumber: ac.tailNumber },
      update: {},
      create: ac,
    });
  }

  // Fetch the created aircraft to link squawks
  const bxa = await prisma.aircraft.findUnique({ where: { tailNumber: 'VT-BXA' } });
  const pra = await prisma.aircraft.findUnique({ where: { tailNumber: 'VT-PRA' } });

  // 3. Create Squawks
  if (bxa) {
    // Only create if we haven't already
    const existingBxaSquawk = await prisma.squawk.findFirst({ where: { aircraftId: bxa.id } });
    if (!existingBxaSquawk) {
      await prisma.squawk.create({
        data: {
          aircraftId: bxa.id,
          issue: 'Left brake feels soft on rollout',
          severity: 'Critical',
          status: 'Open',
        },
      });
    }
  }

  if (pra) {
    const existingPraSquawk = await prisma.squawk.findFirst({ where: { aircraftId: pra.id } });
    if (!existingPraSquawk) {
      await prisma.squawk.create({
        data: {
          aircraftId: pra.id,
          issue: 'Unusual vibration above 2,500 RPM',
          severity: 'Major',
          status: 'Open',
        },
      });
    }
  }

  // 4. Create Activities
  const activitiesCount = await prisma.maintenanceActivity.count();
  if (activitiesCount === 0) {
    await prisma.maintenanceActivity.createMany({
      data: [
        { description: 'Resolved left brake issue on VT-BXA.', type: 'Complete', userId: ameUser1.id },
        { description: 'Maintenance alert reported for Aircraft VT-PRA.', type: 'Alert', userId: ameUser2.id },
        { description: 'Annual inspection completed for VT-KLM.', type: 'Success' },
      ],
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
