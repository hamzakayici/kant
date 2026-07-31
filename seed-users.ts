import { prisma } from "./src/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const users = [
    { email: 'john@example.com', password: 'password123', role: 'REQUESTER' },
    { email: 'jane@example.com', password: 'password123', role: 'DESIGNER' },
    { email: 'mike@example.com', password: 'password123', role: 'EDITOR' },
    { email: 'sarah@example.com', password: 'password123', role: 'ADMIN' },
    { email: 'alex@example.com', password: 'password123', role: 'REQUESTER' }
  ]

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10)
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashedPassword,
        role: u.role as any
      }
    })
  }
  console.log('Users seeded.')
}
main()
