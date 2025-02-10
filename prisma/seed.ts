import { PrismaClient } from '@prisma/client'
import { bulkAssignPatientColors } from '../src/lib/prisma-middleware'

const prisma = new PrismaClient()
//console.dir(Object.keys(prisma), { maxArrayLength: null })

async function main() {
  console.log('Starting to assign colors to patients...')
  await bulkAssignPatientColors(prisma)
  console.log('Color assignment complete!')
}

main()
  .catch((e) => {
    console.error('Error in seed script:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })