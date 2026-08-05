const { PrismaClient } = require('./src/generated/prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = "hamzakayc@gmail.com";
  const password = await bcrypt.hash("H.k26101994", 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: 'ADMIN'
    },
    create: {
      email,
      password,
      role: 'ADMIN',
      firstName: 'Hamza',
      lastName: 'Kayıcı',
      mustChangePassword: false,
      isActive: true,
      color: '#3b82f6'
    }
  });

  console.log("Kullanici olusturuldu:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
