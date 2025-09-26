'use client';

import { QuestionnaireProvider } from '@/contexts/QuestionnaireContext';
import { QuestionnaireFlow } from '@/components/questionnaire/QuestionnaireFlow';

export default function HomePage() {
  return (
    <QuestionnaireProvider>
      <QuestionnaireFlow />
    </QuestionnaireProvider>
  );
}
