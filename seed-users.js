const { PrismaClient } = require('./src/generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: 'john_doe', email: 'john@example.com', password: 'password123', role: 'REQUESTER' },
    { username: 'jane_smith', email: 'jane@example.com', password: 'password123', role: 'DESIGNER' },
    { username: 'mike_w', email: 'mike@example.com', password: 'password123', role: 'EDITOR' },
    { username: 'sarah_k', email: 'sarah@example.com', password: 'password123', role: 'ADMIN' },
    { username: 'alex_t', email: 'alex@example.com', password: 'password123', role: 'REQUESTER' }
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        password: u.password,
        role: u.role
      }
    });
  }
  console.log('Users seeded.');
}
main().finally(() => prisma.$disconnect());
