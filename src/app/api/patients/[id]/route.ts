import { NextRequest, NextResponse } from 'next/server'
import prisma, { appPrisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop();
  
  if (!id) {
    return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
  }

  try {
    const patientId = BigInt(id)
    
    // Get patient from main database
    const [patient, appointments] = await Promise.all([
      prisma.patient.findUnique({
        where: { PatNum: patientId },
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
      }),
      prisma.appointment.findMany({
        where: {
          PatNum: patientId,
          AptDateTime: {
            gte: new Date('2000-10-27'),
            lte: new Date('2099-12-31')
          }
        },
        select: {
          AptNum: true,
          AptDateTime: true,
          AptStatus: true,
          Note: true,
          ProcDescript: true
        },
        orderBy: {
          AptDateTime: 'asc'
        }
      })
    ])

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Get color reference from app database
    const patientRef = await appPrisma.patientReference.findFirst({
      where: {
        patientId: patient.PatNum
      }
    })

    // Combine the data and convert BigInt to string for serialization
    const serializedPatient = {
      ...patient,
      PatNum: patient.PatNum.toString(),
      Gender: patient.Gender ?? 0,
      Address: patient.Address ?? null,
      colorIndex: patientRef?.colorIndex || 1,
      appointments: appointments.map(apt => ({
        ...apt,
        AptNum: apt.AptNum.toString(),
        AptDateTime: apt.AptDateTime.toISOString()
      }))
    }

    return NextResponse.json(serializedPatient)
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 })
  }
} 