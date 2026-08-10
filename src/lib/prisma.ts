import { PrismaClient } from "../generated/prisma/client/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const PRISMA_CLIENT_VERSION = 8
const PRISMA_GLOBAL_KEY = `prisma_zubee_v${PRISMA_CLIENT_VERSION}`

const globalForPrisma = globalThis as unknown as {
  [PRISMA_GLOBAL_KEY]?: PrismaClient
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

function createPrismaClient() {
  const client = new PrismaClient({ adapter }) as PrismaClient & {
    __zubeeVersion?: number
  }
  client.__zubeeVersion = PRISMA_CLIENT_VERSION
  return client
}

function isPrismaClientReady(client: PrismaClient | undefined): client is PrismaClient {
  return Boolean(
    client &&
      (client as PrismaClient & { __zubeeVersion?: number }).__zubeeVersion ===
        PRISMA_CLIENT_VERSION,
  )
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma[PRISMA_GLOBAL_KEY]

  if (isPrismaClientReady(existing)) {
    return existing
  }

  const client = createPrismaClient()
  globalForPrisma[PRISMA_GLOBAL_KEY] = client
  return client
}

export const prisma = getPrismaClient()
