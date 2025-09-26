'use client';

import React from 'react';
import { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  answer?: Question;
  onChange: (selected: number) => void;
  questionNumber: number;
}

export function QuestionCard({ question, answer, onChange, questionNumber }: QuestionCardProps) {
  const selectedIndex = answer?.selected ?? question.selected ?? 0;

  const handleOptionClick = (index: number) => {
    onChange(index);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-2">
          Question {questionNumber}
        </span>
        <h3 className="text-lg font-semibold text-gray-900">
          {question.text}
        </h3>
      </div>

      <div className="space-y-3">
        {question.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(index)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedIndex === index
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                selectedIndex === index
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedIndex === index && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="font-medium">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
