import "dotenv/config"
import { prisma } from "../src/lib/prisma"

async function main() {
  const users = await prisma.user.findMany({ select: { email: true } })
  console.log("Mevcut Kullanıcılar:", users.map(u => u.email))
}
main()
