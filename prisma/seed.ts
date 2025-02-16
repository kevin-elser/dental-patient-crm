import { PrismaClient as MainPrismaClient } from '@prisma/client'
import { PrismaClient as AppPrismaClient } from './generated/app-client'
import { bulkAssignPatientColors } from '../src/lib/prisma-middleware'

// Used to get patient list and ordering
const prisma = new MainPrismaClient()

// Used to store app-specific data
const appPrisma = new AppPrismaClient()
//console.dir(Object.keys(prisma), { maxArrayLength: null })

async function main() {
  try {
    console.log('Starting database seed...')
    
    // Step 1: Generate dummy insurance data
    console.log('Generating dummy insurance data...')
    await import('./add-dummy-insurance')
    
    // Step 2: Generate dummy appointments
    console.log('Generating dummy appointments...')
    await import('./add-dummy-appointments')
    
    // Step 3: Assign colors to all patients
    console.log('Assigning patient colors...')
    const patientsProcessed = await bulkAssignPatientColors(prisma, appPrisma)
    
    console.log(`Database seed completed successfully! Processed ${patientsProcessed} patients.`)
  } catch (error) {
    console.error('Error during database seed:', error)
    throw error // Re-throw to ensure the process exits with an error code
  }
}

main()
  .catch((e) => {
    console.error('Fatal error in seed script:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await appPrisma.$disconnect()
  })