import { AnalysisFlowService } from '../analysisFlowService';

describe('AnalysisFlowService', () => {
  describe('generateSessionId', () => {
    it('should generate a unique session ID', () => {
      const sessionId1 = AnalysisFlowService.generateSessionId();
      const sessionId2 = AnalysisFlowService.generateSessionId();
      
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(sessionId2).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(sessionId1).not.toBe(sessionId2);
    });
  });
});
