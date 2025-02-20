import { NextResponse } from 'next/server';
import { appPrisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const { title, content } = body;
    
    // Extract used tags from content
    const tagRegex = /{{([^}]+)}}/g;
    const usedTags = [...content.matchAll(tagRegex)].map(match => match[0]);
    
    const template = await appPrisma.messageTemplate.update({
      where: { id },
      data: {
        title,
        content,
        tags: JSON.stringify(usedTags),
      },
    });
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  try {
    await appPrisma.messageTemplate.delete({
      where: { id },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
} 