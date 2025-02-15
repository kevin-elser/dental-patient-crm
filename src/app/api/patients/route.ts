import { NextRequest, NextResponse } from 'next/server'
import prisma, { appPrisma } from '@/lib/prisma'

// Define the shape of a patient in the list
export type PatientListItem = {
  PatNum: string
  LName: string | null
  FName: string | null
  HmPhone: string | null
  WkPhone: string | null
  WirelessPhone: string | null
  Email: string | null
  PatStatus: number
  colorIndex: number
  Address: string | null
  Gender: number
  Birthdate: Date
}

// Define the shape of the list API response
export type PatientListResponse = {
  patients: PatientListItem[]
  totalCount: number
  currentPage: number
  hasMore: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const search = searchParams.get('search') || ''
    const all = searchParams.get('all') === 'true'
    const take = all ? undefined : 100
    const skip = all ? undefined : page * 100

    // Build the where clause for search
    const where = search ? {
      OR: [
        { LName: { contains: search } },
        { FName: { contains: search } },
      ],
    } : undefined;

    // Get total count for pagination
    const totalCount = await prisma.patient.count({ where });

    // Get patients from main database
    const patients = await prisma.patient.findMany({
      where,
      orderBy: { LName: 'asc' },
      skip,
      take,
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
        Address: true,
        Gender: true
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
      Gender: patient.Gender ?? 0,
      Address: patient.Address ?? null,
      colorIndex: colorMap.get(patient.PatNum.toString()) || 1
    }));

    return NextResponse.json({
      patients: serializedPatients,
      totalCount,
      currentPage: page,
      hasMore: !all && (page + 1) * 100 < totalCount
    })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
} 