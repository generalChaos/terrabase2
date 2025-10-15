'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { FlowDetailsModal } from '@/components/admin/FlowDetailsModal';
import { AssetPackModal } from '@/components/admin/AssetPackModal';

interface AdminData {
  flows: {
    total: number;
    recent: any[];
  };
  questions: {
    total: number;
    by_sport: Record<string, number>;
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
  
  // Check if running locally
  const isLocal = process.env.NODE_ENV === 'development' || 
                 (typeof window !== 'undefined' && 
                  (window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1'));
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [showFlowDetails, setShowFlowDetails] = useState(false);
  
  // Gallery State
  const [galleryLogos, setGalleryLogos] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<any | null>(null);
  const [showAssetPackModal, setShowAssetPackModal] = useState(false);
  
  
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


  // Background Removal State
  const [bgRemovalResult, setBgRemovalResult] = useState<UpscaleResult | null>(null);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [bgUploadedFile, setBgUploadedFile] = useState<File | null>(null);
  const [bgImagePreview, setBgImagePreview] = useState<string | null>(null);
  const [bgInputMethod, setBgInputMethod] = useState<'url' | 'upload'>('url');
  const [bgRemovalSettings, setBgRemovalSettings] = useState({
    output_format: 'png',
    quality: 95
  });

  // Logo Preview State
  const [logoPreviewFile, setLogoPreviewFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [selectedBgColor, setSelectedBgColor] = useState('#000000');
  const [activeSection, setActiveSection] = useState<'overview' | 'image-processing' | 'flows' | 'gallery'>('overview');
  const [imageProcessingTab, setImageProcessingTab] = useState<'upscaling' | 'background-removal' | 'logo-preview'>('upscaling');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      
      // Only add password header if not in local development
      if (!isLocal) {
        headers['x-admin-password'] = password;
      }
      
      const response = await fetch('/api/admin', { headers });

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
  }, [isLocal, password]);

  const refreshData = () => {
    loadData();
  };

  const loadGalleryData = useCallback(async () => {
    try {
      setGalleryLoading(true);
      const headers: Record<string, string> = {};
      
      // Only add password header if not in local development
      if (!isLocal) {
        headers['x-admin-password'] = password;
      }
      
      const response = await fetch('/api/admin/gallery', { headers });

      if (response.ok) {
        const result = await response.json();
        setGalleryLogos(result.data || []);
      } else {
        setError('Failed to load gallery data');
      }
    } catch (err) {
      setError('Failed to load gallery data');
    } finally {
      setGalleryLoading(false);
    }
  }, [isLocal, password]);

  const authenticate = useCallback(async () => {
    // Skip authentication in local development
    if (isLocal) {
      setAuthenticated(true);
      loadData();
      return;
    }

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
  }, [isLocal, password, loadData]);

  const handleFlowClick = (flowId: string) => {
    setSelectedFlowId(flowId);
    setShowFlowDetails(true);
  };

  const handleCloseFlowDetails = () => {
    setShowFlowDetails(false);
    setSelectedFlowId(null);
  };

  const handleLogoClick = (logo: any) => {
    setSelectedLogo(logo);
    setShowAssetPackModal(true);
  };

  const handleCloseAssetPackModal = () => {
    setShowAssetPackModal(false);
    setSelectedLogo(null);
  };

  const handleGoToResult = (flowId: string) => {
    // Navigate to the result page
    window.open(`/result/${flowId}`, '_blank');
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

  // Background Removal Functions
  const handleBgFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBgUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBgImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgRemoval = async () => {
    if (!bgImageUrl && !bgUploadedFile) {
      alert('Please provide an image URL or upload a file');
      return;
    }

    setBgRemoving(true);
    setBgRemovalResult(null);

    try {
      const imageUrl = bgImageUrl;
      
      if (bgUploadedFile) {
        // Convert file to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          performBgRemoval(dataUrl);
        };
        reader.readAsDataURL(bgUploadedFile);
        return;
      } else {
        performBgRemoval(imageUrl);
      }
    } catch (error) {
      console.error('Error in background removal:', error);
      setBgRemovalResult({
        success: false,
        error: 'Failed to process image'
      });
      setBgRemoving(false);
    }
  };

  const performBgRemoval = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/remove-background', {
            method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
            body: JSON.stringify({
          image_url: imageUrl,
          output_format: bgRemovalSettings.output_format,
          quality: bgRemovalSettings.quality
            })
          });

      const result = await response.json();

      if (result.success) {
        setBgRemovalResult({
          success: true,
          upscaled_url: result.data.processed_url,
          original_url: imageUrl,
          processing_time_ms: result.data.processing_time_ms,
          file_size_bytes: result.data.file_size_bytes
        });
      } else {
        setBgRemovalResult({
          success: false,
          error: result.error || 'Background removal failed'
        });
      }
    } catch (error) {
      console.error('Background removal error:', error);
      setBgRemovalResult({
        success: false,
        error: 'Failed to remove background'
      });
    } finally {
      setBgRemoving(false);
    }
  };

  const downloadBgRemovedImage = async (url: string, filename: string) => {
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

  // Auto-authenticate in local development
  useEffect(() => {
    if (isLocal && !authenticated) {
      authenticate();
    }
  }, [isLocal, authenticated, authenticate]);

  // Load gallery data when gallery section becomes active
  useEffect(() => {
    if (activeSection === 'gallery' && authenticated && galleryLogos.length === 0) {
      loadGalleryData();
    }
  }, [activeSection, authenticated, galleryLogos.length, loadGalleryData]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Admin Dashboard
          </h1>
          {isLocal ? (
            <div className="text-center">
              <div className="text-green-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Running in local development mode</p>
              <p className="text-sm text-gray-500 mb-6">Password protection is disabled for local development</p>
              <Button
                onClick={authenticate}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                Continue to Admin Dashboard
              </Button>
            </div>
          ) : (
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
          )}
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
            <button
              onClick={() => setActiveSection('gallery')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'gallery'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Gallery
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
                  onClick={() => setImageProcessingTab('background-removal')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    imageProcessingTab === 'background-removal'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Background Removal
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
                      <Image
                        src={imagePreview}
                        alt="Upload preview"
                        width={128}
                        height={128}
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
                        <Image
                          src={upscaleResult.original_url}
                          alt="Original"
                          width={128}
                          height={128}
                          className="max-w-full h-32 object-contain mx-auto"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Upscaled Image ({upscaleResult.scale_factor}x)</h4>
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <Image
                          src={upscaleResult.upscaled_url}
                          alt="Upscaled"
                          width={128}
                          height={128}
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

            {/* Background Removal Tool */}
            {imageProcessingTab === 'background-removal' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Background Removal Tool</h2>
                <p className="text-gray-600 mb-6">Remove backgrounds from images using AI</p>
                
                {/* Input Method Selection */}
                <div className="mb-6">
                  <div className="flex space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bgInputMethod"
                        value="url"
                        checked={bgInputMethod === 'url'}
                        onChange={(e) => setBgInputMethod(e.target.value as 'url' | 'upload')}
                        className="mr-2"
                      />
                      Image URL
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bgInputMethod"
                        value="upload"
                        checked={bgInputMethod === 'upload'}
                        onChange={(e) => setBgInputMethod(e.target.value as 'url' | 'upload')}
                        className="mr-2"
                      />
                      Upload File
                    </label>
                  </div>

                  {bgInputMethod === 'url' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={bgImageUrl}
                        onChange={(e) => setBgImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBgFileUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {bgImagePreview && (
                        <div className="mt-4">
                          <Image
                            src={bgImagePreview}
                            alt="Preview"
                            width={128}
                            height={128}
                            className="max-w-xs h-32 object-contain border rounded"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Settings */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Output Format
                      </label>
                      <select
                        value={bgRemovalSettings.output_format}
                        onChange={(e) => setBgRemovalSettings(prev => ({ ...prev, output_format: e.target.value as 'png' | 'jpg' | 'webp' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="png">PNG (with transparency)</option>
                        <option value="jpg">JPG</option>
                        <option value="webp">WebP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quality: {bgRemovalSettings.quality}%
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={bgRemovalSettings.quality}
                        onChange={(e) => setBgRemovalSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Process Button */}
                <div className="mb-6">
                  <button
                    onClick={handleBgRemoval}
                    disabled={bgRemoving || (!bgImageUrl && !bgUploadedFile)}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bgRemoving ? 'Removing Background...' : 'Remove Background'}
                  </button>
          </div>

                {/* Results */}
                {bgRemovalResult && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
                    
                    {bgRemovalResult.success ? (
          <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Original Image</h4>
                            <div className="border rounded-lg p-2 bg-gray-50">
                              <Image
                                src={bgRemovalResult.original_url}
                                alt="Original"
                                width={128}
                                height={128}
                                className="max-w-full h-32 object-contain mx-auto"
                              />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Background Removed</h4>
                            <div className="border rounded-lg p-2 bg-gray-50">
                              <Image
                                src={bgRemovalResult.upscaled_url}
                                alt="Background Removed"
                                width={128}
                                height={128}
                                className="max-w-full h-32 object-contain mx-auto"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-green-800">
                                Background removed successfully!
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                Processing time: {bgRemovalResult.processing_time_ms}ms
                                {bgRemovalResult.file_size_bytes && ` • Size: ${(bgRemovalResult.file_size_bytes / 1024 / 1024).toFixed(2)}MB`}
                              </p>
                            </div>
                            <button
                              onClick={() => downloadBgRemovedImage(
                                bgRemovalResult.upscaled_url!,
                                `background-removed-${Date.now()}.${bgRemovalSettings.output_format}`
                              )}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-800">
                          Background removal failed: {bgRemovalResult.error}
                        </p>
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
                            <Image
                              src={logoPreviewUrl}
                              alt="Logo preview"
                              width={64}
                              height={64}
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
                        <Image
                          src={logoPreviewUrl}
                          alt="Logo preview"
                          width={256}
                          height={256}
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

        {activeSection === 'gallery' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Logo Gallery</h2>
              <div className="flex space-x-4">
                <Button
                  onClick={loadGalleryData}
                  disabled={galleryLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {galleryLoading ? 'Loading...' : 'Refresh Gallery'}
                </Button>
              </div>
            </div>
            
            
            {galleryLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading gallery...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {galleryLogos.map((logo) => (
                  <div
                    key={logo.id}
                    onClick={() => handleLogoClick(logo)}
                    className="group cursor-pointer bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200 hover:border-blue-300"
                  >
                    <div className="aspect-square mb-3 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                      <Image
                        src={logo.public_url}
                        alt={`${logo.flow.team_name} Logo`}
                        width={128}
                        height={128}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-logo.png';
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {logo.flow.team_name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {logo.flow.sport}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Variant {logo.variant_number}
                      </p>
                      {logo.asset_packs.length > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {logo.asset_packs.length} Asset Pack{logo.asset_packs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!galleryLoading && galleryLogos.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No logos found</h3>
                <p className="text-gray-500">Click &quot;Refresh Gallery&quot; to load logos from the database.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Flow Details Modal */}
      <FlowDetailsModal
        flowId={selectedFlowId}
        isOpen={showFlowDetails}
        onClose={handleCloseFlowDetails}
      />

      {/* Asset Pack Modal */}
      <AssetPackModal
        logo={selectedLogo}
        isOpen={showAssetPackModal}
        onClose={handleCloseAssetPackModal}
        onGoToResult={handleGoToResult}
      />
    </div>
  );
}
