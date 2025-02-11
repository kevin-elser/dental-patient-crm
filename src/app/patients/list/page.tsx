import { PatientTable } from "@/components/patients/patient-table"
import prisma, { appPrisma } from "@/lib/prisma"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

async function PatientList() {
  const count = await prisma.patient.count()

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
  })

  // Get color references from app database
  const patientRefs = await appPrisma.patientReference.findMany({
    where: {
      patientId: {
        in: patients.map(p => p.PatNum)
      }
    }
  })

  // Create a map of patient IDs to colors
  const colorMap = new Map(
    patientRefs.map(ref => [ref.patientId.toString(), ref.colorIndex])
  )

  // Combine the data and convert BigInt to string for serialization
  const serializedPatients = patients.map(patient => ({
    ...patient,
    PatNum: patient.PatNum.toString(),
    colorIndex: colorMap.get(patient.PatNum.toString()) || 1 // Default to 1 if no color assigned
  }))

  return <PatientTable patients={serializedPatients} totalCount={count} />
}

export default function PatientListPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Patient List</h1>
        <Link href="/patients/groups/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </Link>
      </div>
      <Suspense fallback={<PatientTable patients={[]} totalCount={0} isLoading={true} />}>
        <PatientList />
      </Suspense>
    </div>
  )
} 