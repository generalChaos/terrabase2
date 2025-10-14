import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    IMAGE_PROCESSOR_BASE_URL: process.env.IMAGE_PROCESSOR_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    message: 'Environment variables'
  });
}
