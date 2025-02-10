import { PrismaClient } from '@prisma/client'

export const NUM_COLORS = 8

export type PatientWithColor = {
  PatNum: bigint
  LName: string | null
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
  prisma: PrismaClient,
  newPatientPatNum: bigint,
  newPatientLastName: string | null
) {
  // Get the patients immediately before and after the new patient
  const adjacentPatients = await prisma.patient.findMany({
    where: {
      AND: [
        { PatNum: { not: newPatientPatNum } },
        {
          OR: [
            // Get patient with next highest last name
            { LName: { gt: newPatientLastName || '' } },
            // Get patient with next lowest last name
            { LName: { lt: newPatientLastName || '' } }
          ]
        }
      ]
    },
    orderBy: { LName: 'asc' },
    select: { PatNum: true, LName: true, colorIndex: true },
    take: 2 // We only need the immediate neighbors
  })

  // Get colors to avoid (colors of adjacent patients)
  const colorsToAvoid = adjacentPatients.map(p => p.colorIndex)
  
  // Assign a color that doesn't conflict
  const newColor = getNonConflictingColor(colorsToAvoid)

  // Update only the new patient
  await prisma.patient.update({
    where: { PatNum: newPatientPatNum },
    data: { colorIndex: newColor }
  })
}

/**
 * Ensures no color conflicts after a patient is removed
 */
export async function updateColorsAfterRemoval(
  prisma: PrismaClient,
  removedPatientLastName: string | null
) {
  // Get the patients that will become adjacent after removal
  const newlyAdjacentPatients = await prisma.patient.findMany({
    where: {
      OR: [
        // Get patient with next highest last name
        { LName: { gt: removedPatientLastName || '' } },
        // Get patient with next lowest last name
        { LName: { lt: removedPatientLastName || '' } }
      ]
    },
    orderBy: { LName: 'asc' },
    select: { PatNum: true, LName: true, colorIndex: true },
    take: 2 // We only need the immediate neighbors
  })

  // If the newly adjacent patients share a color, update the first one
  if (newlyAdjacentPatients.length === 2 && 
      newlyAdjacentPatients[0].colorIndex === newlyAdjacentPatients[1].colorIndex) {
    
    // Get the patient before the first of our pair to check its color
    const previousPatient = await prisma.patient.findFirst({
      where: { LName: { lt: newlyAdjacentPatients[0].LName || '' } },
      orderBy: { LName: 'desc' },
      select: { colorIndex: true }
    })

    const colorsToAvoid = [
      newlyAdjacentPatients[1].colorIndex,
      previousPatient?.colorIndex
    ].filter((color): color is number => typeof color === 'number')

    const newColor = getNonConflictingColor(colorsToAvoid)

    // Update only the first patient of the pair
    await prisma.patient.update({
      where: { PatNum: newlyAdjacentPatients[0].PatNum },
      data: { colorIndex: newColor }
    })
  }
} 