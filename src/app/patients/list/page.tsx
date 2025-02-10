import { PatientTable } from "@/components/patients/patient-table"
import prisma from "@/lib/prisma"
import { Suspense } from "react"

async function PatientList() {
  // Debug: First check if we can get any patients at all
  const count = await prisma.patient.count()
  console.log('Total patients in database:', count)

  const patients = await prisma.patient.findMany({
    orderBy: { LName: 'asc' },
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

  return <PatientTable patients={serializedPatients} />
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