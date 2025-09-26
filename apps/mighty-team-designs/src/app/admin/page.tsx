'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FlowDetailsModal } from '@/components/admin/FlowDetailsModal';

interface AdminData {
  flows: {
    total: number;
    recent: any[];
  };
  questions: {
    total: number;
    by_sport: Record<string, number>;
    by_age_group: Record<string, number>;
  };
  logos: {
    total: number;
    recent: any[];
  };
  debug_logs: {
    total: number;
    recent: any[];
  };
  system_metrics: {
    question_generation_time_avg: number;
    logo_generation_time_avg: number;
    error_rate: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [showFlowDetails, setShowFlowDetails] = useState(false);

  const authenticate = async () => {
    try {
      const response = await fetch('/api/admin', {
        headers: {
          'x-admin-password': password
        }
      });

      if (response.ok) {
        setAuthenticated(true);
        loadData();
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Authentication failed');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin', {
        headers: {
          'x-admin-password': password
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        setError('Failed to load admin data');
      }
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  const handleFlowClick = (flowId: string) => {
    setSelectedFlowId(flowId);
    setShowFlowDetails(true);
  };

  const handleCloseFlowDetails = () => {
    setShowFlowDetails(false);
    setSelectedFlowId(null);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Admin Dashboard
          </h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                onKeyPress={(e) => e.key === 'Enter' && authenticate()}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button
              onClick={authenticate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex space-x-4">
              <Button
                onClick={refreshData}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                Refresh
              </Button>
              <Button
                onClick={() => setAuthenticated(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Flows</h3>
            <p className="text-3xl font-bold text-blue-600">{data?.flows.total || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Question Sets</h3>
            <p className="text-3xl font-bold text-green-600">{data?.questions.total || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generated Logos</h3>
            <p className="text-3xl font-bold text-purple-600">{data?.logos.total || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Debug Logs</h3>
            <p className="text-3xl font-bold text-orange-600">{data?.debug_logs.total || 0}</p>
          </div>
        </div>

        {/* System Metrics */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Avg Question Generation Time</h3>
              <p className="text-2xl font-bold text-gray-900">
                {data?.system_metrics.question_generation_time_avg || 0}ms
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Avg Logo Generation Time</h3>
              <p className="text-2xl font-bold text-gray-900">
                {data?.system_metrics.logo_generation_time_avg || 0}ms
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
              <p className="text-2xl font-bold text-gray-900">
                {((data?.system_metrics.error_rate || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Recent Flows */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Flows</h2>
            <span className="text-sm text-gray-500">Click any row to view details</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age Group
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
                {data?.flows.recent.map((flow: any) => (
                  <tr 
                    key={flow.id}
                    onClick={() => handleFlowClick(flow.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {flow.team_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flow.sport}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flow.age_group}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        flow.current_step === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : flow.current_step === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {flow.current_step}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(flow.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Question Sets by Sport/Age */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions by Sport</h2>
            <div className="space-y-2">
              {Object.entries(data?.questions.by_sport || {}).map(([sport, count]) => (
                <div key={sport} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{sport}</span>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions by Age Group</h2>
            <div className="space-y-2">
              {Object.entries(data?.questions.by_age_group || {}).map(([ageGroup, count]) => (
                <div key={ageGroup} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{ageGroup}</span>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Debug Logs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Debug Logs</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data?.debug_logs.recent.map((log: any) => (
              <div key={log.id} className="border-l-4 border-gray-200 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                      log.log_level === 'error' 
                        ? 'bg-red-100 text-red-800'
                        : log.log_level === 'warn'
                        ? 'bg-yellow-100 text-yellow-800'
                        : log.log_level === 'info'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {log.log_level}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{log.category}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flow Details Modal */}
      <FlowDetailsModal
        flowId={selectedFlowId}
        isOpen={showFlowDetails}
        onClose={handleCloseFlowDetails}
      />
    </div>
  );
}
