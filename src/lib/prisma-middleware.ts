import { PrismaClient, Prisma } from '@prisma/client'
import { getNonConflictingColor } from './patient-colors'

type PatientWithColor = {
  id: string
  LName: string
  colorIndex: number
}

/**
 * Assigns colors to all patients in bulk - optimized for initial database population
 * This is much faster than assigning colors one by one through middleware
 */
export async function bulkAssignPatientColors(prisma: PrismaClient) {
  // Get all patients ordered by last name
  const patients = await prisma.patient.findMany({
    orderBy: { LName: 'asc' },
    select: { id: true, LName: true, colorIndex: true }
  })

  // Process in chunks to avoid memory issues with large datasets
  const CHUNK_SIZE = 1000
  const updates: Promise<any>[] = []

  for (let i = 0; i < patients.length; i++) {
    const prevPatient = i > 0 ? patients[i - 1] : null
    const currentPatient = patients[i]
    const nextPatient = i < patients.length - 1 ? patients[i + 1] : null

    // Get colors to avoid (from adjacent patients)
    const colorsToAvoid = [
      prevPatient?.colorIndex,
      nextPatient?.colorIndex
    ].filter(Boolean)

    const newColor = getNonConflictingColor(colorsToAvoid)

    // Only update if color needs to change
    if (currentPatient.colorIndex !== newColor) {
      updates.push(
        prisma.patient.update({
          where: { id: currentPatient.id },
          data: { colorIndex: newColor }
        })
      )
    }

    // Process in chunks to avoid overwhelming the database
    if (updates.length === CHUNK_SIZE || i === patients.length - 1) {
      await Promise.all(updates)
      updates.length = 0
    }
  }
}

/**
 * Adds middleware to handle patient color assignments automatically
 * Note: For initial database population, use bulkAssignPatientColors instead
 * Caching might be a viable option here if performance becomes an issue
 */
export function addPatientColorMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params: Prisma.MiddlewareParams, next) => {
    try {
      // Only handle patient model operations
      if (params.model?.toLowerCase() !== 'patient') {
        return next(params)
      }

      // Handle different operations
      switch (params.action) {
        case 'create': {
          // First let the creation happen
          const result = await next(params)

          // Then assign the color based on adjacent patients
          const adjacentPatients = await prisma.patient.findMany({
            where: {
              AND: [
                { id: { not: result.id } },
                {
                  OR: [
                    { LName: { gt: result.LName } },
                    { LName: { lt: result.LName } }
                  ]
                }
              ]
            },
            orderBy: { LName: 'asc' },
            select: { id: true, LName: true, colorIndex: true },
            take: 2
          })

          const colorsToAvoid = adjacentPatients.map((p: PatientWithColor) => p.colorIndex)
          const newColor = getNonConflictingColor(colorsToAvoid)

          // Update with the new color
          return prisma.patient.update({
            where: { id: result.id },
            data: { colorIndex: newColor }
          })
        }

        case 'delete': {
          // First get the patient being deleted
          const patientToDelete = await prisma.patient.findUnique({
            where: params.args.where,
            select: { LName: true }
          })

          if (!patientToDelete) {
            throw new Error('Patient not found')
          }

          // Get patients that will become adjacent
          const newlyAdjacentPatients = await prisma.patient.findMany({
            where: {
              AND: [
                params.args.where, // Exclude the patient being deleted
                {
                  OR: [
                    { LName: { gt: patientToDelete.LName } },
                    { LName: { lt: patientToDelete.LName } }
                  ]
                }
              ]
            },
            orderBy: { LName: 'asc' },
            select: { id: true, LName: true, colorIndex: true },
            take: 2
          }) as PatientWithColor[]

          // Perform the deletion
          const result = await next(params)

          // If the newly adjacent patients share a color, update the first one
          if (newlyAdjacentPatients.length === 2 && 
              newlyAdjacentPatients[0].colorIndex === newlyAdjacentPatients[1].colorIndex) {
            
            // Get the patient before our first patient
            const previousPatient = await prisma.patient.findFirst({
              where: { LName: { lt: newlyAdjacentPatients[0].LName } },
              orderBy: { LName: 'desc' },
              select: { colorIndex: true }
            })

            const colorsToAvoid = [
              newlyAdjacentPatients[1].colorIndex,
              previousPatient?.colorIndex
            ].filter(Boolean)

            const newColor = getNonConflictingColor(colorsToAvoid)

            await prisma.patient.update({
              where: { id: newlyAdjacentPatients[0].id },
              data: { colorIndex: newColor }
            })
          }

          return result
        }

        case 'update': {
          // Only handle color conflicts if the last name is being updated
          if (!params.args.data.LName) {
            return next(params)
          }

          const result = await next(params)

          // Check for conflicts with new adjacent patients
          const adjacentPatients = await prisma.patient.findMany({
            where: {
              AND: [
                { id: { not: result.id } },
                {
                  OR: [
                    { LName: { gt: result.LName } },
                    { LName: { lt: result.LName } }
                  ]
                }
              ]
            },
            orderBy: { LName: 'asc' },
            select: { id: true, LName: true, colorIndex: true },
            take: 2
          }) as PatientWithColor[]

          // If either adjacent patient shares our color, get a new one
          if (adjacentPatients.some((p: PatientWithColor) => p.colorIndex === result.colorIndex)) {
            const colorsToAvoid = adjacentPatients.map((p: PatientWithColor) => p.colorIndex)
            const newColor = getNonConflictingColor(colorsToAvoid)

            return prisma.patient.update({
              where: { id: result.id },
              data: { colorIndex: newColor }
            })
          }

          return result
        }

        default:
          return next(params)
      }
    } catch (error) {
      console.error('Error in patient color middleware:', error)
      // Still allow the operation to proceed even if color assignment fails
      return next(params)
    }
  })
} 