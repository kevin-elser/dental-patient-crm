import { NextRequest, NextResponse } from 'next/server'
import prisma, { appPrisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const search = searchParams.get('search') || ''
    const take = 100
    const skip = page * take

    // Get patients from main database
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { LName: { contains: search } },
          { FName: { contains: search } },
        ],
      },
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

    return NextResponse.json(serializedPatients)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
} 