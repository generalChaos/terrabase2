'use client';

import React, { useState } from 'react';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LogoStyleSelector } from './LogoStyleSelector';

const SPORTS = [
  { value: 'generic', label: 'Generic Logo' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'football', label: 'Football' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'track', label: 'Track & Field' },
  { value: 'golf', label: 'Golf' },
  { value: 'other', label: 'Other' }
];

// Age groups removed - no longer needed for Step 2

export function Round1Form() {
  const { state, dispatch, createFlow } = useQuestionnaire();
  const [formData, setFormData] = useState({
    team_name: state.round1Answers.team_name,
    sport: state.round1Answers.sport || 'generic', // Default to Generic Logo
    logo_style: state.round1Answers.logo_style || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.team_name.trim()) {
      newErrors.team_name = 'Team name is required';
    } else if (formData.team_name.trim().length < 2) {
      newErrors.team_name = 'Team name must be at least 2 characters';
    }

    if (!formData.sport) {
      newErrors.sport = 'Please select a sport';
    }

    // Age group validation removed

    if (!formData.logo_style) {
      newErrors.logo_style = 'Please select a logo style';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await createFlow({
        team_name: formData.team_name.trim(),
        sport: formData.sport,
        logo_style: formData.logo_style,
        debug_mode: process.env.NODE_ENV === 'development'
      });
    } catch (error) {
      console.error('Error creating flow:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Tell us about your team
        </h2>
        <p className="text-lg text-gray-600">
          We&apos;ll use this information to create the perfect logo for your team
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Name */}
        <div>
          <label htmlFor="team_name" className="block text-sm font-medium text-gray-700 mb-2">
            Team Name *
          </label>
          <Input
            id="team_name"
            type="text"
            value={formData.team_name}
            onChange={(e) => handleInputChange('team_name', e.target.value)}
            placeholder="Enter your team name"
            className={errors.team_name ? 'border-red-500' : ''}
          />
          {errors.team_name && (
            <p className="mt-1 text-sm text-red-600">{errors.team_name}</p>
          )}
        </div>

        {/* Sport */}
        <div>
          <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-2">
            Sport/Activity *
          </label>
          <Select
            id="sport"
            value={formData.sport}
            onChange={(e) => handleInputChange('sport', e.target.value)}
            className={errors.sport ? 'border-red-500' : ''}
          >
            <option value="">Select a sport or activity</option>
            {SPORTS.map((sport) => (
              <option key={sport.value} value={sport.value}>
                {sport.label}
              </option>
            ))}
          </Select>
          {errors.sport && (
            <p className="mt-1 text-sm text-red-600">{errors.sport}</p>
          )}
        </div>

        {/* Age Group removed - no longer needed */}

        {/* Logo Style Selection */}
        <div>
          <LogoStyleSelector
            selectedStyle={formData.logo_style}
            onStyleSelect={(styleId) => handleInputChange('logo_style', styleId)}
          />
          {errors.logo_style && (
            <p className="mt-2 text-sm text-red-600 text-center">{errors.logo_style}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Creating...' : 'Continue to Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
}
