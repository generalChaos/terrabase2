import { NextRequest, NextResponse } from 'next/server';
import { AnalysisFlowService } from '@/lib/analysisFlowService';

// GET /api/tests/analysis-flows - Test Analysis Flow system
export async function GET(request: NextRequest) {
  try {
    console.log('Test Analysis Flows endpoint called');
    
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'all';
    
    const results: any = {
      timestamp: new Date().toISOString(),
      testType,
      success: true,
      results: {}
    };

    switch (testType) {
      case 'create':
        // Test creating a new analysis flow
        const testImageId = `test-image-${Date.now()}`;
        const testSessionId = AnalysisFlowService.generateSessionId();
        
        const newFlow = await AnalysisFlowService.createAnalysisFlow({
          imageId: testImageId,
          sessionId: testSessionId,
          analysisFlowState: {
            currentQuestionIndex: 0,
            totalQuestions: 0,
            questions: [],
            contextData: {
              imageAnalysis: 'Test image analysis',
              previousAnswers: [],
              artisticDirection: 'Test artistic direction'
            }
          }
        });
        
        results.results.createFlow = {
          success: true,
          flowId: newFlow.id,
          imageId: testImageId,
          sessionId: testSessionId
        };
        break;

      case 'list':
        // Test listing analysis flows
        const flows = await AnalysisFlowService.getAnalysisFlowsForImage('test-image-123');
        results.results.listFlows = {
          success: true,
          count: flows.length,
          flows: flows.map(f => ({
            id: f.id,
            imageId: f.image_id,
            sessionId: f.session_id,
            isActive: f.is_active,
            createdAt: f.created_at
          }))
        };
        break;

      case 'active':
        // Test getting active analysis flow
        const activeFlow = await AnalysisFlowService.getActiveAnalysisFlow('test-image-123');
        results.results.activeFlow = {
          success: true,
          hasActiveFlow: !!activeFlow,
          flowId: activeFlow?.id || null
        };
        break;

      case 'all':
      default:
        // Run all tests
        const testImageIdAll = `test-image-all-${Date.now()}`;
        const testSessionIdAll = AnalysisFlowService.generateSessionId();
        
        // Test 1: Create flow
        const flow = await AnalysisFlowService.createAnalysisFlow({
          imageId: testImageIdAll,
          sessionId: testSessionIdAll,
          analysisFlowState: {
            currentQuestionIndex: 0,
            totalQuestions: 0,
            questions: [],
            contextData: {
              imageAnalysis: 'Test image analysis',
              previousAnswers: [],
              artisticDirection: 'Test artistic direction'
            }
          }
        });
        
        // Test 2: Get flow
        const retrievedFlow = await AnalysisFlowService.getAnalysisFlow(flow.id);
        
        // Test 3: Add question
        await AnalysisFlowService.addQuestion(flow.id, {
          id: 'test-question-1',
          text: 'What style would you like?',
          options: ['Realistic', 'Cartoon', 'Abstract', 'None']
        });
        
        // Test 4: Add answer
        await AnalysisFlowService.addAnswer(flow.id, 'test-question-1', 'Realistic');
        
        // Test 5: Get updated flow
        const updatedFlow = await AnalysisFlowService.getAnalysisFlow(flow.id);
        
        // Test 6: Deactivate flow
        await AnalysisFlowService.deactivateAnalysisFlow(flow.id);
        
        results.results = {
          createFlow: { success: true, flowId: flow.id },
          getFlow: { success: true, flowId: retrievedFlow?.id },
          addQuestion: { success: true },
          addAnswer: { success: true },
          getUpdatedFlow: { 
            success: true, 
            questionsCount: updatedFlow?.conversation_state.questions.length || 0,
            answeredQuestions: updatedFlow?.conversation_state.questions.filter(q => q.answer).length || 0
          },
          deactivateFlow: { success: true }
        };
        break;
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Test Analysis Flows error:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
