import { Metadata } from "next";
import { SelectablePatientTable } from "@/components/patients/selectable-patient-table";
import prisma, { appPrisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Create Patient Group",
  description: "Create a new patient group",
};

async function CreateGroupPage() {
  const count = await prisma.patient.count();

  // Get patients from main database
  const patients = await prisma.patient.findMany({
    orderBy: { LName: 'asc' },
    take: 100,
    select: {
      PatNum: true,
      LName: true,
      FName: true,
      Birthdate: true,
      HmPhone: true,
      WkPhone: true,
      WirelessPhone: true,
      Email: true,
      PatStatus: true,
    }
  });

  // Get color references from app database
  const patientRefs = await appPrisma.patientReference.findMany({
    where: {
      patientId: {
        in: patients.map(p => p.PatNum)
      }
    }
  });

  // Create a map of patient IDs to colors
  const colorMap = new Map(
    patientRefs.map(ref => [ref.patientId.toString(), ref.colorIndex])
  );

  // Combine the data and convert BigInt to string for serialization
  const serializedPatients = patients.map(patient => ({
    ...patient,
    PatNum: patient.PatNum.toString(),
    colorIndex: colorMap.get(patient.PatNum.toString()) || 1
  }));

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Patient Group</h1>
          <p className="text-muted-foreground">
            Select patients to add to your new group
          </p>
        </div>
      </div>
      <SelectablePatientTable
        patients={serializedPatients}
        totalCount={count}
      />
    </div>
  );
}

export default CreateGroupPage; 