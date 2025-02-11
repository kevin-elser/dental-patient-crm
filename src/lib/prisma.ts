import { PrismaClient as MainPrismaClient } from '@prisma/client'
import { PrismaClient as AppPrismaClient } from '../../prisma/generated/app-client'
import { patientColorExtension } from './prisma-middleware'

declare global {
  var prisma: MainPrismaClient | undefined
  var appPrisma: AppPrismaClient | undefined
}

// Main database client
const prisma = global.prisma || new MainPrismaClient()
// App-specific database client
const appPrisma = global.appPrisma || new AppPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
  global.appPrisma = appPrisma
}

// Add the patient color extension to the app client
const extendedAppPrisma = patientColorExtension(appPrisma)

export { prisma as default, extendedAppPrisma as appPrisma } 