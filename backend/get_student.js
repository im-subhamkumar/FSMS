import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.student.findFirst({
    include: {
      account: true
    }
  });
  console.log(JSON.stringify(student, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());


