'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';
import { Button } from '@/components/ui/Button';
import { QuestionCard } from './QuestionCard';

export function Round2Form() {
  const { state, dispatch, updateFlow, getQuestions, generateQuestions } = useQuestionnaire();
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  console.log('Round2Form render - round2Questions length:', state.round2Questions.length);
  console.log('Round2Form render - round2Questions:', state.round2Questions);

  const loadQuestions = useCallback(async () => {
    try {
      setIsGeneratingQuestions(true);
      await getQuestions(state.round1Answers.sport, state.round1Answers.age_group);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [getQuestions, state.round1Answers.sport, state.round1Answers.age_group]);

  // Remove automatic loading - let user choose to load or generate questions
  // useEffect(() => {
  //   if (state.round2Questions.length === 0 && state.round1Answers.sport && state.round1Answers.age_group) {
  //     loadQuestions();
  //   }
  // }, [state.round1Answers.sport, state.round1Answers.age_group, loadQuestions, state.round2Questions.length]);

  const handleGenerateQuestions = async () => {
    try {
      setIsGeneratingQuestions(true);
      await generateQuestions();
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswerChange = (questionId: string, selected: number) => {
    dispatch({ type: 'UPDATE_ROUND2_ANSWER', payload: { questionId, selected } });
  };

  const handleSubmit = async () => {
    if (!state.flow) return;

    try {
      await updateFlow({
        round2_questions: state.round2Questions,
        round2_answers: state.round2Answers.map(q => ({
          question_id: q.id,
          answer: q.options[q.selected || 0] || ''
        })),
        current_step: 'generating'
      });
    } catch (error) {
      console.error('Error updating flow:', error);
    }
  };

  const isFormValid = state.round2Answers.every(answer => 
    answer.selected !== undefined && answer.selected >= 0
  );

  if (isGeneratingQuestions) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Generating Questions
        </h2>
        <p className="text-gray-600">
          Creating personalized questions for your {state.round1Answers.sport} team...
        </p>
      </div>
    );
  }

  if (state.round2Questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready for Round 2
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Let&apos;s get some more details about your team&apos;s style and preferences
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={loadQuestions}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            disabled={isGeneratingQuestions}
          >
            {isGeneratingQuestions ? 'Loading...' : 'Load Questions'}
          </Button>
          
          <div className="text-gray-500">or</div>
          
          <Button
            onClick={handleGenerateQuestions}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            disabled={isGeneratingQuestions}
          >
            {isGeneratingQuestions ? 'Generating...' : 'Generate AI Questions'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Tell us about your team&apos;s style
        </h2>
        <p className="text-lg text-gray-600">
          Help us understand what kind of logo would best represent your team
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {state.round2Questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            answer={state.round2Answers.find(a => a.id === question.id)}
            onChange={(selected) => handleAnswerChange(question.id, selected)}
            questionNumber={index + 1}
          />
        ))}
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          onClick={handleGenerateQuestions}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          disabled={isGeneratingQuestions}
        >
          {isGeneratingQuestions ? 'Generating...' : 'Generate New Questions'}
        </Button>

        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          disabled={!isFormValid || state.isLoading}
        >
          {state.isLoading ? 'Saving...' : 'Generate Logo'}
        </Button>
      </div>
    </div>
  );
}
