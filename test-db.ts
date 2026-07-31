import { prisma } from './src/lib/prisma'

async function main() {
  try {
    const users = await prisma.user.findMany()
    console.log("Users:", users.length)
  } catch (e) {
    console.error("Error:", e)
  } finally {
    await prisma.$disconnect()
  }
}
main()
