import { PrismaClient as MainPrismaClient } from '@prisma/client'
import { PrismaClient as AppPrismaClient } from '../../prisma/generated/app-client'
import { getNonConflictingColor } from './patient-colors'

/**
 * Gets colors of patients with the same last name and adjacent last names
 */
async function getAdjacentPatientColors(
  prisma: MainPrismaClient,
  appPrisma: AppPrismaClient,
  patientId: bigint,
  lastName: string | null
): Promise<number[]> {
  if (!lastName) return [];
  
  // Get all patients with the same last name (except current patient)
  const sameLastNamePatients = await prisma.patient.findMany({
    where: {
      AND: [
        { LName: lastName },
        { PatNum: { not: patientId } }
      ]
    },
    select: { PatNum: true }
  });

  // Get the next and previous different last names
  const [prevDifferentLastName, nextDifferentLastName] = await Promise.all([
    prisma.patient.findFirst({
      where: { LName: { lt: lastName } },
      orderBy: { LName: 'desc' },
      select: { PatNum: true }
    }),
    prisma.patient.findFirst({
      where: { LName: { gt: lastName } },
      orderBy: { LName: 'asc' },
      select: { PatNum: true }
    })
  ]);

  // Get color references for all relevant patients
  const patientIds = [
    ...sameLastNamePatients.map(p => p.PatNum),
    prevDifferentLastName?.PatNum,
    nextDifferentLastName?.PatNum
  ].filter((id): id is bigint => id !== undefined && id !== null);

  const colorRefs = await appPrisma.patientReference.findMany({
    where: {
      patientId: { in: patientIds }
    }
  });

  return colorRefs.map(ref => ref.colorIndex);
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
    select: { PatNum: true, LName: true }
  });

  console.log(`Found ${patients.length} patients to process`);

  // Process sequentially to ensure color consistency
  for (let i = 0; i < patients.length; i++) {
    const currentPatient = patients[i];
    
    // Get colors to avoid from same-name and adjacent patients
    const colorsToAvoid = await getAdjacentPatientColors(
      prisma,
      appPrisma,
      currentPatient.PatNum,
      currentPatient.LName
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

          // Get the patient's last name from the main database
          const mainPatient = await appPrisma.$queryRaw<{ LName: string }[]>`
            SELECT LName FROM patient WHERE PatNum = ${result.patientId}
          `;

          if (!mainPatient.length) return result;

          // Get colors to avoid from same-name and adjacent patients
          const colorsToAvoid = await getAdjacentPatientColors(
            appPrisma as unknown as MainPrismaClient, // Type cast needed since we're using raw queries
            appPrisma,
            result.patientId, // Now safe since we checked it exists
            mainPatient[0].LName
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