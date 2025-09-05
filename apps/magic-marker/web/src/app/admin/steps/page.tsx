'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

interface ProcessingStep {
  id: string;
  image_id: string;
  step_type: 'analysis' | 'questions' | 'conversational_question' | 'answer_analysis' | 'image_generation';
  step_order: number;
  prompt_id?: string;
  prompt_content?: string;
  input_data: unknown;
  output_data: unknown;
  response_time_ms: number;
  tokens_used?: number;
  model_used: string;
  success: boolean;
  error_message?: string;
  created_at: string;
  images?: {
    original_image_path: string;
    final_image_path: string;
  };
}

export default function StepsPage() {
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    step_type: '',
    image_id: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0
  });

  const fetchSteps = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.step_type) params.append('step_type', filters.step_type);
      if (filters.image_id) params.append('image_id', filters.image_id);
      params.append('limit', pagination.limit.toString());
      params.append('offset', pagination.offset.toString());

      const response = await fetch(`/api/admin/steps?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch steps');
      }
      const data = await response.json();
      setSteps(data.steps);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load steps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps, filters, pagination.offset]);

  const getStepTypeColor = (stepType: string) => {
    switch (stepType) {
      case 'analysis': return 'bg-blue-100 text-blue-800';
      case 'questions': return 'bg-green-100 text-green-800';
      case 'conversational_question': return 'bg-cyan-100 text-cyan-800';
      case 'answer_analysis': return 'bg-yellow-100 text-yellow-800';
      case 'image_generation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <AdminLayout title="Processing Steps">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading steps...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Processing Steps">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Processing Steps</h1>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Admin
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Step Type
              </label>
              <select
                value={filters.step_type}
                onChange={(e) => setFilters(prev => ({ ...prev, step_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="analysis">Analysis</option>
                <option value="questions">Questions</option>
                <option value="answer_analysis">Answer Analysis</option>
                <option value="image_generation">Image Generation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image ID
              </label>
              <input
                type="text"
                value={filters.image_id}
                onChange={(e) => setFilters(prev => ({ ...prev, image_id: e.target.value }))}
                placeholder="Enter image ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ step_type: '', image_id: '' })}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {steps.filter(s => s.step_type === 'analysis').length}
            </div>
            <div className="text-sm text-gray-600">Analysis Steps</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {steps.filter(s => s.step_type === 'questions').length}
            </div>
            <div className="text-sm text-gray-600">Question Steps</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {steps.filter(s => s.step_type === 'answer_analysis').length}
            </div>
            <div className="text-sm text-gray-600">Answer Analysis</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {steps.filter(s => s.step_type === 'image_generation').length}
            </div>
            <div className="text-sm text-gray-600">Image Generation</div>
          </div>
        </div>

        {/* Steps Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Processing Steps ({pagination.total})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Step
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {steps.map((step) => (
                  <tr key={step.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {step.step_order}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStepTypeColor(step.step_type)}`}>
                          {step.step_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/images?search=${step.image_id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {step.image_id.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {step.model_used}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatResponseTime(step.response_time_ms)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {step.tokens_used || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        step.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {step.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(step.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} steps
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
