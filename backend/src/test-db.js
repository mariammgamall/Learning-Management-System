const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log('Seeded users list in DB:');
  for (const user of users) {
    const isMatch = await bcrypt.compare('Password@123', user.password);
    console.log(`- ${user.email} | Name: ${user.name} | Role: ${user.role} | Active: ${user.isActive} | Pass Match: ${isMatch}`);
  }
}

run().catch(console.error);
