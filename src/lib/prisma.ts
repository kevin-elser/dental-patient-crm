import { PrismaClient } from '@prisma/client'
import { addPatientColorMiddleware } from './prisma-middleware'

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// Add the patient color middleware
addPatientColorMiddleware(prisma)

export default prisma 