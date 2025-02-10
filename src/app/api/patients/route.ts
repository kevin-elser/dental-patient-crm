import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '0')
  const search = searchParams.get('search') || ''

  try {
    const patients = await prisma.patient.findMany({
      take: 100,
      skip: page * 100,
      where: {
        OR: [
          { LName: { contains: search } },
          { FName: { contains: search } },
        ],
      },
      orderBy: [
        { LName: 'asc' },
        { PatNum: 'asc' }
      ],
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
        colorIndex: true,
      },
    })

    // Convert BigInt to string for serialization
    const serializedPatients = patients.map(patient => ({
      ...patient,
      PatNum: patient.PatNum.toString(),
    }))

    return NextResponse.json(serializedPatients)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
} 