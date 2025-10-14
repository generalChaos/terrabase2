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

interface UpscaleResult {
  success: boolean;
  upscaled_url?: string;
  original_url?: string;
  scale_factor?: number;
  processing_time_ms?: number;
  file_size_bytes?: number;
  error?: string;
}


export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [showFlowDetails, setShowFlowDetails] = useState(false);
  
  // Upscale State
  const [upscaleResult, setUpscaleResult] = useState<UpscaleResult | null>(null);
  const [upscaling, setUpscaling] = useState(false);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop&crop=center');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>('url');
  const [upscaleSettings, setUpscaleSettings] = useState({
    scale_factor: 2,
    output_format: 'png',
    quality: 90
  });


  // Logo Preview State
  const [logoPreviewFile, setLogoPreviewFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [selectedBgColor, setSelectedBgColor] = useState('#000000');
  const [activeSection, setActiveSection] = useState<'overview' | 'image-processing' | 'flows'>('overview');
  const [imageProcessingTab, setImageProcessingTab] = useState<'upscaling' | 'logo-preview'>('upscaling');


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

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUpscaleResult({ success: false, error: 'Please select a valid image file' });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUpscaleResult({ success: false, error: 'File size must be less than 10MB' });
        return;
      }

      setUploadedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upscale function
  const handleUpscale = async () => {
    let imageToUpscale: string;

    if (inputMethod === 'upload') {
      if (!uploadedFile) {
        setUpscaleResult({ success: false, error: 'Please upload an image file' });
        return;
      }
      
      // Convert file to data URL for upscaling
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        await performUpscale(dataUrl);
      };
      reader.readAsDataURL(uploadedFile);
      return;
    } else {
      if (!imageUrl) {
        setUpscaleResult({ success: false, error: 'Image URL is required' });
        return;
      }
      await performUpscale(imageUrl);
    }
  };

  const performUpscale = async (imageInput: string) => {
    setUpscaling(true);
    setUpscaleResult(null);

    try {
      const response = await fetch('/api/upscale', {
            method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
            body: JSON.stringify({
          image_url: imageInput,
          scale_factor: upscaleSettings.scale_factor,
          output_format: upscaleSettings.output_format,
          quality: upscaleSettings.quality
            })
          });

      const result = await response.json();

      if (result.success) {
        setUpscaleResult(result);
      } else {
        setUpscaleResult({
          success: false,
          error: result.error || 'Upscaling failed'
        });
      }
    } catch (error) {
      setUpscaleResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      });
    } finally {
      setUpscaling(false);
    }
  };

  const downloadUpscaledImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };


  // Logo Preview Functions
  const handleLogoPreviewUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return;
      }

      setLogoPreviewFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // T-shirt color palette (reused from TShirtModal)
  const T_SHIRT_COLORS = [
    // Most Popular Colors (Classic & Versatile)
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Sport Grey', hex: '#A8A8A8' },
    { name: 'Charcoal', hex: '#36454F' },
    { name: 'Royal', hex: '#4169E1' },
    { name: 'Navy', hex: '#000080' },
    
    // Popular Team Colors
    { name: 'Maroon', hex: '#800000' },
    { name: 'Forest Green', hex: '#228B22' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Old Gold', hex: '#CFB53B' },
    
    // Secondary Popular Colors
    { name: 'Light Blue', hex: '#87CEEB' },
    { name: 'Tropical Blue', hex: '#0077BE' },
    { name: 'Indigo Blue', hex: '#4B0082' },
    { name: 'Military Green', hex: '#4B5320' },
    { name: 'Ash', hex: '#B2BEB5' },
    
    // Accent Colors
    { name: 'Safety Orange', hex: '#FF6600' },
    { name: 'Antique Heliconia', hex: '#FF6B6B' },
    { name: 'Heliconia', hex: '#FF69B4' },
    { name: 'Coral Silk', hex: '#FF7F7F' },
    { name: 'Daisy', hex: '#FFE135' },
    { name: 'Safety Green', hex: '#00FF00' },
    { name: 'Antique Irish Green', hex: '#4ECDC4' },
    
    // Specialty Colors
    { name: 'Dark Chocolate', hex: '#3C2415' },
    { name: 'Brown Savana', hex: '#8B4513' }
  ];


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
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('image-processing')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'image-processing'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Image Processing
            </button>
            <button
              onClick={() => setActiveSection('flows')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'flows'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Flows
            </button>
          </nav>
        </div>
        {/* Content based on active section */}
        {activeSection === 'overview' && (
          <>
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
          </>
        )}

        {activeSection === 'image-processing' && (
          <>
            {/* Image Processing Tabs */}
            <div className="mb-6">
              <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setImageProcessingTab('upscaling')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    imageProcessingTab === 'upscaling'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Image Upscaling
                </button>
                <button
                  onClick={() => setImageProcessingTab('logo-preview')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    imageProcessingTab === 'logo-preview'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Logo Preview
                </button>
              </nav>
            </div>

            {/* Image Upscaling Tool */}
            {imageProcessingTab === 'upscaling' && (
              <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Image Upscaling Tool</h2>
          
          {/* Input Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Input Method</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputMethod"
                  value="url"
                  checked={inputMethod === 'url'}
                  onChange={(e) => {
                    setInputMethod(e.target.value as 'url' | 'upload');
                    // Clear uploaded file when switching to URL mode
                    if (e.target.value === 'url') {
                      setUploadedFile(null);
                      setImagePreview(null);
                    }
                  }}
                  className="mr-2"
                />
                Image URL
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputMethod"
                  value="upload"
                  checked={inputMethod === 'upload'}
                  onChange={(e) => setInputMethod(e.target.value as 'url' | 'upload')}
                  className="mr-2"
                />
                Upload File
              </label>
            </div>
          </div>

          {/* Image Input */}
          <div className="mb-6">
            {inputMethod === 'url' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</span>
                  </label>
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Preview</label>
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          setImagePreview(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="border rounded-lg p-2 bg-gray-50">
                      <img
                        src={imagePreview}
                        alt="Upload preview"
                        className="max-w-full h-32 object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upscaling Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scale Factor
              </label>
              <select
                value={upscaleSettings.scale_factor}
                onChange={(e) => setUpscaleSettings(prev => ({ ...prev, scale_factor: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>2x</option>
                <option value={4}>4x</option>
                <option value={8}>8x</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                value={upscaleSettings.output_format}
                onChange={(e) => setUpscaleSettings(prev => ({ ...prev, output_format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality: {upscaleSettings.quality}%
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={upscaleSettings.quality}
                onChange={(e) => setUpscaleSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Upscale Button */}
          <div className="mb-6">
            <Button
              onClick={handleUpscale}
              disabled={upscaling || (inputMethod === 'url' ? !imageUrl : !uploadedFile)}
              className={`w-full ${
                upscaling
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-semibold py-2 px-4 rounded-md`}
            >
              {upscaling ? 'Upscaling...' : `Upscale Image ${upscaleSettings.scale_factor}x`}
            </Button>
          </div>

          {/* Upscaling Results */}
          {upscaleResult && (
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upscaling Results</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  upscaleResult.success 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {upscaleResult.success ? 'Success' : 'Error'}
                </span>
              </div>
              
              {upscaleResult.success ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Original Image</h4>
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <img
                          src={upscaleResult.original_url}
                          alt="Original"
                          className="max-w-full h-32 object-contain mx-auto"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Upscaled Image ({upscaleResult.scale_factor}x)</h4>
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <img
                          src={upscaleResult.upscaled_url}
                          alt="Upscaled"
                          className="max-w-full h-32 object-contain mx-auto"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Upscaling completed successfully!</p>
                        <p className="text-sm text-green-600">
                          Processing time: {upscaleResult.processing_time_ms}ms | 
                          File size: {upscaleResult.file_size_bytes ? Math.round(upscaleResult.file_size_bytes / 1024) : 'Unknown'}KB
                        </p>
                      </div>
                      <Button
                        onClick={() => downloadUpscaledImage(
                          upscaleResult.upscaled_url!,
                          `upscaled-image-${upscaleResult.scale_factor}x.${upscaleSettings.output_format}`
                        )}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">Upscaling failed</p>
                  <p className="text-sm text-red-600">{upscaleResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
              )}


            {/* Logo Preview Tool */}
            {imageProcessingTab === 'logo-preview' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo Preview Tool</h2>
                <p className="text-gray-600 mb-6">Test how your transparent logo looks on different background colors</p>
                
                {/* Logo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Logo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoPreviewUpload}
                      className="hidden"
                      id="logo-preview-upload"
                    />
                    <label
                      htmlFor="logo-preview-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {logoPreviewFile ? logoPreviewFile.name : 'Click to upload logo'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</span>
                    </label>
                  </div>
                </div>

                {/* Logo Preview */}
                {logoPreviewUrl && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview on Different Backgrounds</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                      {T_SHIRT_COLORS.map((color) => (
                        <div key={color.hex} className="text-center">
                          <div
                            className="w-20 h-20 mx-auto rounded-lg border-2 border-gray-300 flex items-center justify-center mb-1 cursor-pointer hover:border-blue-400 transition-colors"
                            style={{ backgroundColor: color.hex }}
                            onClick={() => setSelectedBgColor(color.hex)}
                          >
                            <img
                              src={logoPreviewUrl}
                              alt="Logo preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <button
                            onClick={() => setSelectedBgColor(color.hex)}
                            className={`text-xs px-1 py-0.5 rounded text-center w-full ${
                              selectedBgColor === color.hex
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {color.name}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Color Preview */}
                {logoPreviewUrl && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Background: {T_SHIRT_COLORS.find(c => c.hex === selectedBgColor)?.name}</h3>
                    <div className="flex justify-center">
                      <div
                        className="w-64 h-64 rounded-lg border-4 border-gray-300 flex items-center justify-center"
                        style={{ backgroundColor: selectedBgColor }}
                      >
                        <img
                          src={logoPreviewUrl}
                          alt="Logo preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeSection === 'flows' && (
          <div className="bg-white p-6 rounded-lg shadow">
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
                )}

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
