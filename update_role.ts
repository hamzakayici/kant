import { prisma } from './src/lib/prisma'

async function main() {
  const result = await prisma.customRole.updateMany({
    where: { id: "system_admin" },
    data: { name: "Müdürlük" }
  });
  console.log("Updated", result.count, "rows.");
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
