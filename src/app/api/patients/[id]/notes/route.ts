import { NextRequest, NextResponse } from 'next/server'
import { appPrisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/')[3] // Get patient ID from URL

  if (!id) {
    return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
  }

  try {
    const patientId = BigInt(id)
    
    // First get the patient reference
    const patientRef = await appPrisma.patientReference.findFirst({
      where: { patientId },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!patientRef) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(patientRef.notes)
  } catch (error) {
    console.error('Error fetching patient notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/')[3] // Get patient ID from URL

  if (!id) {
    return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
  }

  try {
    const patientId = BigInt(id)
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Note content cannot exceed 5000 characters' },
        { status: 400 }
      )
    }

    // First get or create the patient reference
    let patientRef = await appPrisma.patientReference.findFirst({
      where: { patientId }
    })

    if (!patientRef) {
      patientRef = await appPrisma.patientReference.create({
        data: {
          patientId,
          colorIndex: 1
        }
      })
    }

    // Create the note
    const note = await appPrisma.patientNote.create({
      data: {
        title,
        content,
        patientRefId: patientRef.id
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating patient note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
} 