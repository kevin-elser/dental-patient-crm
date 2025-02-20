import { NextResponse } from 'next/server';
import { appPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const templates = await appPrisma.messageTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content } = body;
    
    // Extract used tags from content
    const tagRegex = /{{([^}]+)}}/g;
    const usedTags = [...content.matchAll(tagRegex)].map(match => match[0]);
    
    const template = await appPrisma.messageTemplate.create({
      data: {
        title,
        content,
        tags: JSON.stringify(usedTags),
        createdBy: 'user@example.com', // TODO: Replace with actual user email from auth
      },
    });
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
} 