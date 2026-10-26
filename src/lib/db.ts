import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// في الإنتاج: لا نسجّل query (أداء أفضل)
// في التطوير: نسجّل query للتصحيح
const logLevel = process.env.NODE_ENV === 'production'
  ? ['error', 'warn']
  : ['query', 'error', 'warn']

function createPrismaClient() {
  return new PrismaClient({
    log: logLevel as any,
  })
}

// تجنب إنشاء عدة PrismaClient في بيئة serverless (Vercel)
// عبر تخزينه على globalThis
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
