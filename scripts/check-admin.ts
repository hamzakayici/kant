import "dotenv/config"
import { prisma } from "../src/lib/prisma"

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, isActive: true, password: true }
  })
  console.log(users)
}
main()
