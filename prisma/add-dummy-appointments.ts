import { PrismaClient } from '@prisma/client'

// This script solely exists to add dummy appointments to the database for testing purposes

async function main() {
  const prisma = new PrismaClient()
  
  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        PatNum: true
      }
    })

    console.log(`Found ${patients.length} total patients`)

    const numPatientsToUpdate = Math.floor(patients.length * 0.75)
    
    const shuffledPatients = patients.sort(() => Math.random() - 0.5).slice(0, numPatientsToUpdate)
    
    console.log(`Creating appointments for ${shuffledPatients.length} patients`)

    // Create appointments for selected patients
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    for (const patient of shuffledPatients) {
      await prisma.appointment.create({
        data: {
          PatNum: patient.PatNum,
          AptDateTime: oneMonthAgo,
          ProcDescript: "This is a dummy procedure note",
          Note: "This is a dummy note",
          AptStatus: 2, // Completed status
          ProvNum: 1, // Default provider
          ClinicNum: 1, // Default clinic
          Op: 1,
          Confirmed: 1,
          TimeLocked: true,
          ProvHyg: 1,
          UnschedStatus: 0,
          Assistant: 0,
          IsHygiene: 0,
          DateTimeArrived: oneMonthAgo,
          DateTimeSeated: oneMonthAgo,
          DateTimeDismissed: oneMonthAgo,
          InsPlan1: 0,
          InsPlan2: 0,
          ColorOverride: 0,
          AppointmentTypeNum: 1,
          Priority: 0,
          ProvBarText: "",
          PatternSecondary: "",
          SecurityHash: "",
          ItemOrderPlanned: 0,
          NextAptNum: 0,
          ProcsColored: "",
          SecUserNumEntry: 1,
          SecDateTEntry: oneMonthAgo,
          DateTimeAskedToArrive: oneMonthAgo
        }
      })
    }

    console.log('Successfully created dummy appointments')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 