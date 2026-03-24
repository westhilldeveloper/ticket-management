import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL

  // If the URL starts with prisma://, use Accelerate
  if (url?.startsWith('prisma://')) {
    return new PrismaClient({
      datasourceUrl: url,
    }).$extends(withAccelerate())
  }

  // Otherwise, use standard Prisma for local scripts/development
  return new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma