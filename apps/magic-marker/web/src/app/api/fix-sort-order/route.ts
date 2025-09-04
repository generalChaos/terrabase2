import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/fix-sort-order - Fix the sort_order values to match logical pipeline
export async function POST() {
  try {
    console.log('🔧 Fixing sort_order values...');

    // Update sort_order to match logical pipeline order
    const updates = [
      { name: 'image_analysis', sort_order: 1 },
      { name: 'questions_generation', sort_order: 2 },
      { name: 'conversational_question', sort_order: 3 },
      { name: 'text_processing', sort_order: 4 },
      { name: 'image_text_analysis', sort_order: 5 },
      { name: 'image_prompt_creation', sort_order: 6 }
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('prompt_definitions')
        .update({ sort_order: update.sort_order })
        .eq('name', update.name);

      if (error) {
        console.error(`Error updating ${update.name}:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    console.log('✅ Sort order fixed!');

    return NextResponse.json({
      success: true,
      message: 'Sort order fixed successfully!'
    });
  } catch (error) {
    console.error('❌ Error fixing sort order:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
