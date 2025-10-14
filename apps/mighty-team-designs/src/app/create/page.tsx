'use client';

import React from 'react';
import Link from 'next/link';
import { QuestionnaireProvider } from '@/contexts/QuestionnaireContext';
import { QuestionnaireFlow } from '@/components/questionnaire/QuestionnaireFlow';

export default function CreatePage() {
  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        background: 'linear-gradient(to bottom, #0F012B, #441F74)'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/28"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-start pt-10 pb-16">

        {/* Flow container */}
        <div className="w-full max-w-5xl px-6">
          <div className="bg-white/10 border border-white/20 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-500 hover:bg-white/15 hover:border-white/30 hover:shadow-2xl transform-gpu">
            <div className="p-6 sm:p-8">
              <QuestionnaireProvider>
                <QuestionnaireFlow />
              </QuestionnaireProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
