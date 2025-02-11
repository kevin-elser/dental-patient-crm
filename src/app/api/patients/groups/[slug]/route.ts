import { NextRequest, NextResponse } from "next/server";
import { appPrisma } from "@/lib/prisma";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/').pop();
  
  if (!slug) {
    return NextResponse.json({ error: 'Group slug is required' }, { status: 400 });
  }

  try {
    // Convert slug back to group name
    const groupName = slug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    const group = await appPrisma.patientGroup.findFirst({
      where: {
        name: groupName
      },
      include: {
        patients: true,
        _count: {
          select: {
            patients: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Patient group not found' },
        { status: 404 }
      );
    }

    // Get the patient IDs from the references
    const patientIds = group.patients.map(ref => ref.patientId);

    // Fetch the actual patient data from the main database
    const patients = await prisma.patient.findMany({
      where: {
        PatNum: {
          in: patientIds
        }
      },
      select: {
        PatNum: true,
        LName: true,
        FName: true,
        HmPhone: true,
        WkPhone: true,
        WirelessPhone: true,
        Email: true,
        PatStatus: true,
      }
    });

    // Create a map of patient references to get their color indices
    const colorMap = new Map(
      group.patients.map(ref => [ref.patientId.toString(), ref.colorIndex])
    );

    // Combine the data and add color indices
    const patientsWithColors = patients.map(patient => ({
      ...patient,
      PatNum: patient.PatNum.toString(),
      colorIndex: colorMap.get(patient.PatNum.toString()) || 1
    }));

    return NextResponse.json({
      ...group,
      patients: patientsWithColors
    });
  } catch (error) {
    console.error('Error fetching patient group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient group' },
      { status: 500 }
    );
  }
} 