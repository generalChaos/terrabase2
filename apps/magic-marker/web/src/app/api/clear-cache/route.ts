import { NextResponse } from 'next/server';
import { PromptExecutor } from '@/lib/promptExecutor';

// POST /api/clear-cache - Clear prompt cache
export async function POST() {
  try {
    PromptExecutor.clearCache();
    return NextResponse.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
