import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const hashedPassword = await bcrypt.hash("5858", 10)
  
  await prisma.user.updateMany({
    data: {
      password: hashedPassword,
      mustChangePassword: true
    }
  })
  
  console.log("Tüm kullanıcıların şifresi 5858 yapıldı ve zorunlu değiştirme aktif edildi.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
