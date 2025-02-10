import { PatientTable } from "@/components/patients/patient-table"
import type { Patient } from "@/types/patient"
import { Suspense } from "react"

async function PatientList() {
  // TODO: Once Prisma is set up, fetch patients here
  // const patients = await prisma.patient.findMany({
  //   orderBy: { LName: 'asc' }
  // })
  
  // Temporary empty array until database is ready
  const patients: Patient[] = []

  return <PatientTable patients={patients} />
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