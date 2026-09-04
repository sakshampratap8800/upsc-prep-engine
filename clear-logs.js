const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.importLog.deleteMany({
    where: { fileType: { in: ['prelims', 'mains', 'essay', 'anthropology', 'sociology'] } }
  });
  console.log('Cleared PYQ import logs');
}
run();
