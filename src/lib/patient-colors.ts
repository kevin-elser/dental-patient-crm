import { PrismaClient as MainPrismaClient } from '@prisma/client'
import { PrismaClient as AppPrismaClient } from '../../prisma/generated/app-client'

export const NUM_COLORS = 8

export type PatientWithColor = {
  patientId: bigint
  colorIndex: number
}

/**
 * Gets a color that doesn't conflict with the given colors
 */
export function getNonConflictingColor(usedColors: number[]): number {
  const availableColors = Array.from({ length: NUM_COLORS }, (_, i) => i + 1)
    .filter(color => !usedColors.includes(color))
  
  return availableColors[Math.floor(Math.random() * availableColors.length)] || 1
}

/**
 * Assigns a color to a new patient, only checking adjacent patients
 */
export async function assignColorToNewPatient(
  prisma: MainPrismaClient,
  appPrisma: AppPrismaClient,
  newPatientPatNum: bigint,
  newPatientLastName: string | null
) {
  // Get the patient info from main database to find adjacent patients
  const adjacentPatients = await prisma.patient.findMany({
    where: {
      AND: [
        { PatNum: { not: newPatientPatNum } },
        {
          OR: [
            { LName: { gt: newPatientLastName || '' } },
            { LName: { lt: newPatientLastName || '' } }
          ]
        }
      ]
    },
    orderBy: { LName: 'asc' },
    select: { PatNum: true },
    take: 2
  })

  // Get the color references for adjacent patients
  const adjacentRefs = await appPrisma.patientReference.findMany({
    where: {
      patientId: {
        in: adjacentPatients.map(p => p.PatNum)
      }
    }
  })

  // Get colors to avoid
  const colorsToAvoid = adjacentRefs.map(ref => ref.colorIndex)
  
  // Assign a color that doesn't conflict
  const newColor = getNonConflictingColor(colorsToAvoid)

  // Create or update the patient reference
  await appPrisma.patientReference.upsert({
    where: {
      patientId: newPatientPatNum
    },
    create: {
      patientId: newPatientPatNum,
      colorIndex: newColor
    },
    update: {
      colorIndex: newColor
    }
  })
}

/**
 * Ensures no color conflicts after a patient is removed
 */
export async function updateColorsAfterRemoval(
  prisma: MainPrismaClient,
  appPrisma: AppPrismaClient,
  removedPatientLastName: string | null
) {
  // Get the patients that will become adjacent after removal
  const newlyAdjacentPatients = await prisma.patient.findMany({
    where: {
      OR: [
        { LName: { gt: removedPatientLastName || '' } },
        { LName: { lt: removedPatientLastName || '' } }
      ]
    },
    orderBy: { LName: 'asc' },
    select: { PatNum: true, LName: true },
    take: 2
  })

  if (newlyAdjacentPatients.length < 2) return;

  // Get their color references
  const adjacentRefs = await appPrisma.patientReference.findMany({
    where: {
      patientId: {
        in: newlyAdjacentPatients.map(p => p.PatNum)
      }
    }
  })

  // If the newly adjacent patients share a color, update the first one
  if (adjacentRefs.length === 2 && adjacentRefs[0].colorIndex === adjacentRefs[1].colorIndex) {
    // Get the patient before the first of our pair to check its color
    const previousPatient = await prisma.patient.findFirst({
      where: { LName: { lt: newlyAdjacentPatients[0].LName || '' } },
      orderBy: { LName: 'desc' },
      select: { PatNum: true }
    })

    let previousRef = previousPatient ? await appPrisma.patientReference.findFirst({
      where: { patientId: previousPatient.PatNum }
    }) : null;

    const colorsToAvoid = [
      adjacentRefs[1].colorIndex,
      previousRef?.colorIndex
    ].filter((color): color is number => typeof color === 'number')

    const newColor = getNonConflictingColor(colorsToAvoid)

    // Update only the first patient's reference
    await appPrisma.patientReference.update({
      where: {
        patientId: newlyAdjacentPatients[0].PatNum
      },
      data: { colorIndex: newColor }
    })
  }
} 