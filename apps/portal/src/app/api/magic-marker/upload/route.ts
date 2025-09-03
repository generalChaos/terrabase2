import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    message: 'Upload endpoint - Coming Soon!',
    status: 'placeholder',
    note: 'This will handle image uploads and AI analysis',
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxSize: '10MB'
  });
}
