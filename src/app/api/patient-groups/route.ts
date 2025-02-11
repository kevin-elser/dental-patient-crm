import { NextRequest, NextResponse } from "next/server";
import { appPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const groups = await appPrisma.patientGroup.findMany({
      include: {
        _count: {
          select: {
            patients: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching patient groups:', error);
    return NextResponse.json({ error: 'Failed to fetch patient groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, tags } = body;

    // Validate name length
    if (name.length > 16) {
      return NextResponse.json(
        { error: 'Group name must be 16 characters or less' },
        { status: 400 }
      );
    }

    const group = await appPrisma.patientGroup.create({
      data: {
        name,
        description,
        tags: tags ? JSON.stringify(tags) : null
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error creating patient group:', error);
    return NextResponse.json({ error: 'Failed to create patient group' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    await appPrisma.patientGroup.delete({
      where: {
        id: parseInt(id)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient group:', error);
    return NextResponse.json({ error: 'Failed to delete patient group' }, { status: 500 });
  }
} 