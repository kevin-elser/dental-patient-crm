import { PrismaClient as MainPrismaClient } from '@prisma/client'
import { PrismaClient as AppPrismaClient } from '../../prisma/generated/app-client'
import { getNonConflictingColor } from './patient-colors'

/**
 * Gets colors of immediately adjacent patients in the sorted list
 */
async function getVisuallyAdjacentColors(
  prisma: MainPrismaClient,
  appPrisma: AppPrismaClient,
  patientId: bigint
): Promise<number[]> {
  // Get the current patient to find neighbors
  const currentPatient = await prisma.patient.findUnique({
    where: { PatNum: patientId },
    select: { LName: true, FName: true }
  });
  
  if (!currentPatient?.LName || !currentPatient?.FName) return [];

  // Find the patient immediately before and after in sorted order
  const [previousPatient, nextPatient] = await Promise.all([
    prisma.patient.findFirst({
      where: {
        OR: [
          // Same last name, earlier first name
          {
            AND: [
              { LName: currentPatient.LName },
              { FName: { lt: currentPatient.FName } }
            ]
          },
          // Earlier last name
          { LName: { lt: currentPatient.LName } }
        ],
        PatNum: { not: patientId }  // Exclude current patient
      },
      orderBy: [
        { LName: 'desc' },
        { FName: 'desc' },
        { PatNum: 'desc' }  // Tiebreaker for identical names
      ],
      select: { PatNum: true }
    }),
    prisma.patient.findFirst({
      where: {
        OR: [
          // Same last name, later first name
          {
            AND: [
              { LName: currentPatient.LName },
              { FName: { gt: currentPatient.FName } }
            ]
          },
          // Later last name
          { LName: { gt: currentPatient.LName } }
        ],
        PatNum: { not: patientId }  // Exclude current patient
      },
      orderBy: [
        { LName: 'asc' },
        { FName: 'asc' },
        { PatNum: 'asc' }  // Tiebreaker for identical names
      ],
      select: { PatNum: true }
    })
  ]);

  // Get colors of adjacent patients
  const adjacentPatientIds = [previousPatient?.PatNum, nextPatient?.PatNum].filter((id): id is bigint => !!id);
  
  if (adjacentPatientIds.length === 0) return [];

  const adjacentRefs = await appPrisma.patientReference.findMany({
    where: {
      patientId: { in: adjacentPatientIds }
    }
  });

  return adjacentRefs.map(ref => ref.colorIndex);
}

/**
 * Assigns colors to all patients in bulk - optimized for initial database population
 */
export async function bulkAssignPatientColors(prisma: MainPrismaClient, appPrisma: AppPrismaClient) {
  console.log('Starting bulk color assignment...');
  
  // First, clear all existing color assignments to start fresh
  console.log('Clearing existing color assignments...');
  await appPrisma.patientReference.deleteMany({});

  // Get all patients ordered by last name and first name
  console.log('Fetching patients...');
  const patients = await prisma.patient.findMany({
    orderBy: [
      { LName: 'asc' },
      { FName: 'asc' }
    ],
    select: { PatNum: true, LName: true, FName: true }
  });

  console.log(`Found ${patients.length} patients to process`);

  // Process sequentially to ensure color consistency
  for (let i = 0; i < patients.length; i++) {
    const currentPatient = patients[i];
    
    // Get colors to avoid from visually adjacent patients
    const colorsToAvoid = await getVisuallyAdjacentColors(
      prisma,
      appPrisma,
      currentPatient.PatNum
    );

    const newColor = getNonConflictingColor(colorsToAvoid);

    // Create the patient reference with the new color
    await appPrisma.patientReference.create({
      data: {
        patientId: currentPatient.PatNum,
        colorIndex: newColor
      }
    });

    // Log progress every 100 patients
    if (i % 100 === 0 || i === patients.length - 1) {
      console.log(`Processed ${i + 1} of ${patients.length} patients (${Math.round(((i + 1) / patients.length) * 100)}%)`);
    }
  }

  console.log('Bulk color assignment completed successfully!');
  return patients.length;
}

/**
 * Extension for handling patient color assignments
 */
export const patientColorExtension = (appPrisma: AppPrismaClient) => {
  return appPrisma.$extends({
    name: 'patientColorExtension',
    query: {
      patientReference: {
        async create({ args, query }) {
          // First let the creation happen
          const result = await query(args);

          if (!result?.patientId) {
            return result;
          }

          // Get the patient's info from the main database
          const mainPatient = await appPrisma.$queryRaw<{ LName: string, FName: string }[]>`
            SELECT LName, FName FROM patient WHERE PatNum = ${result.patientId}
          `;

          if (!mainPatient.length) return result;

          // Get colors to avoid from visually adjacent patients
          const colorsToAvoid = await getVisuallyAdjacentColors(
            appPrisma as unknown as MainPrismaClient,
            appPrisma,
            result.patientId
          );

          const newColor = getNonConflictingColor(colorsToAvoid);

          // Update with the new color
          return appPrisma.patientReference.update({
            where: { id: result.id },
            data: { colorIndex: newColor }
          });
        }
      }
    }
  });
}; 