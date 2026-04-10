const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocs() {
  const docs = await prisma.instructorDocument.findMany();
  console.log('Total documents:', docs.length);
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}

checkDocs();
