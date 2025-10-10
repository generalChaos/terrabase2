import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enhancedTeamDesignService } from '@/lib/services/enhancedTeamDesignService';

const ContactSchema = z.object({
  flow_id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Contact API: Received request');
    const body = await request.json();
    console.log('📧 Contact API: Request body:', body);
    
    const { flow_id, email, phone } = ContactSchema.parse(body);
    console.log('📧 Contact API: Parsed data:', { flow_id, email, phone });

    // Update the flow with contact information
    console.log('📧 Contact API: Calling updateFlow...');
    const updatedFlow = await enhancedTeamDesignService.updateFlow(flow_id, {
      contact_email: email,
      contact_phone: phone
    });
    console.log('📧 Contact API: Update successful:', updatedFlow);

    return NextResponse.json({
      success: true,
      data: {
        flow_id: updatedFlow.id,
        contact_email: updatedFlow.contact_email,
        contact_phone: updatedFlow.contact_phone
      }
    });

  } catch (error) {
    console.error('❌ Contact API Error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add contact information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flow_id = searchParams.get('flow_id');

    if (!flow_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'flow_id parameter is required' 
        },
        { status: 400 }
      );
    }

    // Get the flow to retrieve contact info
    const flow = await enhancedTeamDesignService.getFlowById(flow_id);
    
    if (!flow) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Flow not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        flow_id: flow.id,
        contact_email: flow.contact_email,
        contact_phone: flow.contact_phone
      }
    });

  } catch (error) {
    console.error('Error retrieving contact info:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve contact information' 
      },
      { status: 500 }
    );
  }
}
