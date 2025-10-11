'use client';

import { QuestionnaireProvider } from '@/contexts/QuestionnaireContext';
import { QuestionnaireFlow } from '@/components/questionnaire/QuestionnaireFlow';

// Production home page with full questionnaire flow

export default function HomePage() {
  return (
    <QuestionnaireProvider>
      <QuestionnaireFlow />
    </QuestionnaireProvider>
  );
}
