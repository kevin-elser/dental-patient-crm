import { PatientTable } from "@/components/patients/patient-table"
import prisma from "@/lib/prisma"
import { Suspense } from "react"

async function PatientList() {
  const count = await prisma.patient.count()

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
      colorIndex: true
    }
  })

  // Convert BigInt to string for serialization
  const serializedPatients = patients.map(patient => ({
    ...patient,
    PatNum: patient.PatNum.toString()
  }))

  return <PatientTable patients={serializedPatients} totalCount={count} />
}

export default function PatientListPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Patient List</h1>
      <Suspense fallback={<PatientTable patients={[]} isLoading={true} />}>
        <PatientList />
      </Suspense>
    </div>
  )
} 