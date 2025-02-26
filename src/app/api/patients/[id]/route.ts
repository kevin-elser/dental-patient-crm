import { NextRequest, NextResponse } from 'next/server'
import prisma, { appPrisma } from '@/lib/prisma'

/**
 * TODO: Production Type Considerations (Later)
 * 
 * I like how I'm co-locating types with API routes right now, it's fast for development
 * while things are changing a lot.  But in production, I should think about:
 * 
 * 1. Moving types to a shared package/module if:
 *    - Other apps need these types.
 *    - I want to make a client SDK.
 *    - I need to version the API types.
 * 
 * 2. Using OpenAPI/Swagger to:
 *    - Auto-generate types from the API doc.
 *    - Make the API doc interactive.
 *    - Help with API versioning.
 * 
 * 3. Checking out Zod (or something similar) for:
 *    - Runtime type validation.
 *    - Validating API requests/responses.
 *    - Better type inference.
 */

// Define the shape of what this API returns
export type PatientDetails = {
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
  amountDue: string
  appointments?: {
    AptNum: string
    AptDateTime: string
    AptStatus: number
    Note: string | null
    ProcDescript: string | null
  }[]
  insurance?: {
    PayerName: string | null
    PayerID: string
    MemberID: string | null
    EffectiveDate: string
  }[]
  notes?: {
    id: number
    title: string
    content: string
    createdAt: string
  }[]
}

interface FinancialData {
  amountDue: number | null
}

interface InsuranceData {
  PayerName: string | null
  PayerID: bigint
  MemberID: string | null
  EffectiveDate: Date
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop();
  
  if (!id) {
    return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
  }

  try {
    const patientId = BigInt(id)
    
    // Get patient from main database
    let patient, appointments, financialData, insuranceData, patientRef;
    try {
      [patient, appointments, financialData, insuranceData, patientRef] = await Promise.all([
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
        }),
        prisma.$queryRaw<FinancialData[]>`
          SELECT 
            (SUM(COALESCE(cp.DedEst, 0) + COALESCE(cp.CopayAmt, 0)) - SUM(COALESCE(ps.SplitAmt, 0))) AS amountDue
          FROM patient p
          LEFT JOIN claimproc cp ON p.PatNum = cp.PatNum AND cp.Status = 5
          LEFT JOIN paysplit ps ON p.PatNum = ps.PatNum
          WHERE p.PatNum = ${patientId}
          GROUP BY p.PatNum
        `,
        prisma.$queryRaw<InsuranceData[]>`
          SELECT
            carrier.CarrierName AS PayerName,
            insplan.CarrierNum AS PayerID,
            patplan.PatID AS MemberID,
            inssub.DateEffective AS EffectiveDate
          FROM patient p
          LEFT JOIN patplan ON p.PatNum = patplan.PatNum AND patplan.Ordinal = 1
          LEFT JOIN inssub ON patplan.InsSubNum = inssub.InsSubNum
          LEFT JOIN insplan ON inssub.PlanNum = insplan.PlanNum
          LEFT JOIN carrier ON insplan.CarrierNum = carrier.CarrierNum
          WHERE p.PatNum = ${patientId}
        `,
        appPrisma.patientReference.findFirst({
          where: { patientId },
          include: {
            notes: {
              orderBy: { createdAt: 'desc' }
            }
          }
        })
      ]);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Extract amount due from financial data (will be an array with one object)
    const amountDue = financialData?.[0]?.amountDue ?? 0;

    // Combine the data and convert BigInt to string for serialization
    const serializedPatient = {
      ...patient,
      PatNum: patient.PatNum.toString(),
      Gender: patient.Gender ?? 0,
      Address: patient.Address ?? null,
      colorIndex: patientRef?.colorIndex || 1,
      amountDue: Number(amountDue).toFixed(2),
      appointments: (appointments || []).map(apt => ({
        ...apt,
        AptNum: apt.AptNum.toString(),
        AptDateTime: apt.AptDateTime.toISOString()
      })),
      insurance: (insuranceData || []).map(ins => ({
        PayerName: ins?.PayerName ?? null,
        PayerID: ins?.PayerID?.toString() ?? '',
        MemberID: ins?.MemberID ?? null,
        EffectiveDate: ins?.EffectiveDate?.toISOString() ?? null
      })),
      notes: patientRef?.notes?.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt.toISOString()
      })) || []
    }

    return NextResponse.json(serializedPatient)
  } catch (error) {
    console.error('Error in patient details route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch patient',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 