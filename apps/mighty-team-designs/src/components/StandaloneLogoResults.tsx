'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { GeneratedLogo } from '@/lib/services/imageGenerationService';
import QRCode from 'qrcode';

interface FlowData {
  id: string;
  team_name: string;
  sport: string;
  logo_style: string;
  current_step: string;
  logo_variants?: Array<{
    id: string;
    variant_number: number;
    public_url: string;
    is_selected: boolean;
    generation_prompt: string;
    model_used: string;
    generation_time_ms: number;
    generation_cost_usd: number;
    asset_pack?: {
      id: string;
      clean_logo_url: string;
      tshirt_front_url: string;
      tshirt_back_url: string;
      banner_url?: string;
      processing_time_ms: number;
    } | null;
  }>;
  team_logos?: Array<{
    id: string;
    variant_number: number;
    public_url: string;
    is_selected: boolean;
    generation_prompt: string;
    model_used: string;
    generation_time_ms: number;
    generation_cost_usd: number;
    asset_pack?: {
      id: string;
      clean_logo_url: string;
      tshirt_front_url: string;
      tshirt_back_url: string;
      banner_url?: string;
      processing_time_ms: number;
    } | null;
  }>;
  selected_logo_id: string | null;
  created_at: string;
  updated_at: string;
}

interface StandaloneLogoResultsProps {
  flowData: FlowData;
  onLogoSelect?: (logoId: string) => void;
}

export default function StandaloneLogoResults({ flowData, onLogoSelect }: StandaloneLogoResultsProps) {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(flowData.selected_logo_id || flowData.logo_variants[0]?.id || null);
  const [generatedLogos, setGeneratedLogos] = useState<GeneratedLogo[]>([]);
  const [tshirtColor, setTshirtColor] = useState('black');
  const [tshirtSize, setTshirtSize] = useState('M');
  const [bannerColor, setBannerColor] = useState('blue');
  const [bannerSize, setBannerSize] = useState('large');
  const [contactEmail, setContactEmail] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Extract team colors from generation prompt
  const getTeamColors = () => {
    if (!selectedLogo || !generatedLogos.length) {
      return { primary: '#3B82F6', secondary: '#8B5CF6' }; // Default blue-purple
    }
    
    const selectedLogoData = generatedLogos.find(logo => logo.id === selectedLogo);
    if (!selectedLogoData?.generation_prompt) {
      return { primary: '#3B82F6', secondary: '#8B5CF6' };
    }
    
    const prompt = selectedLogoData.generation_prompt;
    
    // Extract colors from prompt (look for hex codes or color names)
    const hexMatches = prompt.match(/#[0-9A-Fa-f]{6}/g);
    const colorMatches = prompt.match(/\b(red|blue|green|yellow|orange|purple|pink|black|white|navy|maroon|gold|silver)\b/gi);
    
    let primary = '#3B82F6'; // Default blue
    let secondary = '#8B5CF6'; // Default purple
    
    if (hexMatches && hexMatches.length >= 1) {
      primary = hexMatches[0];
      secondary = hexMatches[1] || '#8B5CF6';
    } else if (colorMatches && colorMatches.length >= 1) {
      const colorMap: { [key: string]: string } = {
        'red': '#EF4444', 'blue': '#3B82F6', 'green': '#10B981', 'yellow': '#F59E0B',
        'orange': '#F97316', 'purple': '#8B5CF6', 'pink': '#EC4899', 'black': '#1F2937',
        'white': '#F9FAFB', 'navy': '#1E3A8A', 'maroon': '#7C2D12', 'gold': '#D97706', 'silver': '#6B7280'
      };
      primary = colorMap[colorMatches[0].toLowerCase()] || '#3B82F6';
      secondary = colorMap[colorMatches[1]?.toLowerCase()] || '#8B5CF6';
    }
    
    return { primary, secondary };
  };

  const teamColors = getTeamColors();

  // Convert team logos to GeneratedLogo format
  useEffect(() => {
    console.log('🔄 Converting team logos in StandaloneLogoResults:');
    console.log('📊 Raw flowData:', flowData);
    console.log('📊 flowData.team_logos:', flowData.team_logos);
    console.log('📊 flowData.logo_variants:', flowData.logo_variants);
    
    const logosToConvert = flowData.team_logos || flowData.logo_variants || [];
    console.log('📊 Logos to convert:', logosToConvert);
    console.log('📊 First logo asset_pack:', logosToConvert[0]?.asset_pack);
    
    const convertedLogos = logosToConvert.map(logo => {
      console.log(`📊 Converting logo ${logo.variant_number}:`, {
        id: logo.id,
        public_url: logo.public_url,
        model_used: logo.model_used,
        hasPublicUrl: !!logo.public_url
      });
      
      // Fix the URL structure - remove duplicate team-logos/ prefix if present
      let fixedUrl = logo.public_url || '';
      if (fixedUrl && fixedUrl.includes('/team-logos/team-logos/')) {
        fixedUrl = fixedUrl.replace('/team-logos/team-logos/', '/team-logos/');
        console.log(`🔧 Fixed URL for logo ${logo.variant_number}:`, fixedUrl);
      }
      
      return {
        id: logo.id,
        variant_number: logo.variant_number,
        public_url: fixedUrl,
        model_used: logo.model_used,
        generation_prompt: logo.generation_prompt || '',
        created_at: logo.created_at,
        asset_pack: logo.asset_pack || null
      };
    });
    console.log('📊 Converted logos in StandaloneLogoResults:', convertedLogos);
    console.log('📊 First converted logo public_url:', convertedLogos[0]?.public_url);
    setGeneratedLogos(convertedLogos);
  }, [flowData.team_logos, flowData.logo_variants, flowData]);

  // Generate QR code for this results page
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/results/${flowData.id}`;
        const qrUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };
    generateQR();
  }, [flowData.id]);

  const handleLogoSelect = (logoId: string) => {
    setSelectedLogo(logoId);
    if (onLogoSelect) {
      onLogoSelect(logoId);
    }
  };

  const handleDownload = async (logo: GeneratedLogo) => {
    try {
      const response = await fetch(logo.public_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${flowData.team_name}-logo-${logo.variant_number}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading logo:', error);
    }
  };

  const LogoCard = ({ logo, isSelected }: { logo: GeneratedLogo; isSelected: boolean }) => {
    console.log(`🎨 StandaloneLogoResults LogoCard ${logo.variant_number}:`, {
      id: logo.id,
      public_url: logo.public_url,
      model_used: logo.model_used,
      isSelected,
      hasPublicUrl: !!logo.public_url,
      publicUrlLength: logo.public_url?.length || 0
    });
    
    return (
      <div
        className={`relative cursor-pointer rounded-lg border-2 transition-all ${
          isSelected
            ? 'border-blue-500 shadow-lg scale-105'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => {
          console.log(`🖱️ Logo ${logo.variant_number} clicked, public_url:`, logo.public_url);
          if (logo.public_url) {
            handleLogoSelect(logo.id);
          }
        }}
      >
      <div className="aspect-square p-2">
        {logo.asset_pack?.clean_logo_url ? (
          <div>
            <Image
              src={logo.asset_pack.clean_logo_url}
              alt={`Logo variant ${logo.variant_number}`}
              width={100}
              height={100}
              className="w-full h-full object-contain"
              onLoad={() => console.log(`✅ Clean logo ${logo.variant_number} loaded successfully from:`, logo.asset_pack?.clean_logo_url)}
              onError={(e) => {
                console.error(`❌ Failed to load clean logo ${logo.variant_number} from:`, logo.asset_pack?.clean_logo_url);
                console.error('Error details:', e);
              }}
            />
            <div className="text-xs text-gray-400 mt-1">Clean Logo</div>
          </div>
        ) : logo.public_url ? (
          <div>
            <Image
              src={logo.public_url}
              alt={`Logo variant ${logo.variant_number}`}
              width={100}
              height={100}
              className="w-full h-full object-contain"
              onLoad={() => console.log(`✅ Logo ${logo.variant_number} loaded successfully from:`, logo.public_url)}
              onError={(e) => {
                console.error(`❌ Failed to load logo ${logo.variant_number} from:`, logo.public_url);
                console.error('Error details:', e);
              }}
            />
            <div className="text-xs text-gray-400 mt-1">Original Logo</div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
            <div className="text-gray-400 text-xs">No Logo</div>
          </div>
        )}
      </div>
      <div className="p-2 text-center">
        <p className="text-xs font-medium text-gray-900">Variant {logo.variant_number}</p>
        <p className="text-xs text-gray-500">{logo.model_used}</p>
      </div>
      {isSelected && logo.public_url && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
    );
  };

  if (!flowData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{
        backgroundColor: teamColors.primary
      }}
    >
      <div className="max-w-6xl mx-auto">

        {/* Section 1: Team Information & Roster */}
        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))`,
            borderColor: `${teamColors.primary}20`
          }}
        >
          <div className="flex flex-col sm:flex-row lg:flex-row gap-4 sm:gap-6">
            {/* Team Logo Display */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                {selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.clean_logo_url ? (
                  <Image
                    src={generatedLogos.find(logo => logo.id === selectedLogo)!.asset_pack!.clean_logo_url!}
                    alt="Selected team logo"
                    width={160}
                    height={160}
                    className="object-contain"
                  />
                ) : selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.public_url ? (
                  <Image
                    src={generatedLogos.find(logo => logo.id === selectedLogo)!.public_url}
                    alt="Selected team logo"
                    width={160}
                    height={160}
                    className="object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-xs sm:text-sm">Select Logo</div>
                )}
              </div>
            </div>
            
            {/* Team Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {flowData.team_name}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-4">
                {flowData.sport} Team
              </p>
              
              {/* Team Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Style:</span> {flowData.logo_style}
                </div>
                <div>
                  <span className="font-medium">Generated:</span> {new Date(flowData.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Asset Customization */}
        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))`,
            borderColor: `${teamColors.secondary}20`
          }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Customize Your Assets</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* A) Banner Image */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">A) Banner Image</h3>
              <div className="bg-gray-100 rounded-lg p-4 mb-4" style={{ height: '400px' }}>
                {selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.banner_url ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image
                      src={generatedLogos.find(logo => logo.id === selectedLogo)!.asset_pack!.banner_url!}
                      alt="Team banner"
                      width={800}
                      height={400}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
                        console.error('Failed to load banner image:', e);
                        // Fallback to placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-center text-gray-500">
                      <div className="text-4xl mb-2">🏆</div>
                      <p className="text-sm">Banner preview</p>
                      <p className="text-xs text-gray-400">Coming soon</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <p className="text-sm">Banner preview</p>
                      <p className="text-xs text-gray-400">Coming soon</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={bannerColor}
                    onChange={(e) => setBannerColor(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="blue">Blue</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                  <select
                    value={bannerSize}
                    onChange={(e) => setBannerSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="small">Small (2x1 ft)</option>
                    <option value="medium">Medium (3x2 ft)</option>
                    <option value="large">Large (4x3 ft)</option>
                    <option value="xlarge">X-Large (6x4 ft)</option>
                  </select>
                </div>
              </div>
              <button 
                className="mt-4 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                style={{ 
                  backgroundColor: teamColors.primary,
                  boxShadow: `0 4px 14px 0 ${teamColors.primary}40`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = teamColors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = teamColors.primary;
                }}
              >
                Add Banner
              </button>
            </div>

            {/* B) T-Shirt Image */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">B) T-Shirt Image</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* T-Shirt Preview */}
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center overflow-hidden" style={{ height: '400px', width: '300px' }}>
                    {selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.tshirt_front_url ? (
                      <Image
                        src={generatedLogos.find(logo => logo.id === selectedLogo)!.asset_pack!.tshirt_front_url!}
                        alt="T-shirt"
                        width={300}
                        height={400}
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onError={(e) => {
                          console.error('Failed to load t-shirt image:', e);
                          // Fallback to placeholder
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`text-center text-gray-500 ${selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.tshirt_front_url ? 'hidden' : ''}`}>
                      <div className="text-xl sm:text-2xl mb-1">👕</div>
                      <p className="text-xs">T-shirt preview</p>
                    </div>
                  </div>
                </div>
                
                {/* T-Shirt Controls */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                      <select
                        value={tshirtColor}
                        onChange={(e) => setTshirtColor(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="black">Black</option>
                        <option value="white">White</option>
                        <option value="navy">Navy</option>
                        <option value="red">Red</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                      <select
                        value={tshirtSize}
                        onChange={(e) => setTshirtSize(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="S">S (34-36&ldquo;)</option>
                        <option value="M">M (38-40&ldquo;)</option>
                        <option value="L">L (42-44&ldquo;)</option>
                        <option value="XL">XL (46-48&ldquo;)</option>
                        <option value="XXL">XXL (50-52&ldquo;)</option>
                        <option value="XXXL">XXXL (54-56&ldquo;)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                className="mt-4 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                style={{ 
                  backgroundColor: teamColors.primary,
                  boxShadow: `0 4px 14px 0 ${teamColors.primary}40`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = teamColors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = teamColors.primary;
                }}
              >
                Add T-Shirt
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Logo Selection & Download */}
        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))`,
            borderColor: `${teamColors.primary}20`
          }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Choose Your Logo</h2>
          
          {/* Selected Logo Display */}
          {selectedLogo && (generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.clean_logo_url || generatedLogos.find(logo => logo.id === selectedLogo)?.public_url) && (
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                {generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.clean_logo_url ? (
                  <Image
                    src={generatedLogos.find(logo => logo.id === selectedLogo)!.asset_pack!.clean_logo_url!}
                    alt="Selected team logo"
                    width={288}
                    height={288}
                    className="object-contain"
                  />
                ) : (
                  <Image
                    src={generatedLogos.find(logo => logo.id === selectedLogo)!.public_url}
                    alt="Selected team logo"
                    width={288}
                    height={288}
                    className="object-contain"
                  />
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {flowData.team_name}
              </h3>
              <button 
                onClick={() => selectedLogo && handleDownload(generatedLogos.find(logo => logo.id === selectedLogo)!)}
                className="text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg transition-colors font-semibold text-sm sm:text-base"
                style={{ 
                  backgroundColor: teamColors.primary,
                  boxShadow: `0 4px 14px 0 ${teamColors.primary}40`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = teamColors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = teamColors.primary;
                }}
              >
                Download Selected Logo
              </button>
            </div>
          )}
          
          {/* Alternative Logo Options */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Alternative Options</h3>
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <p><strong>Debug Info (Results Page):</strong></p>
              <p>Generated logos count: {generatedLogos.length}</p>
              <p>Selected logo: {selectedLogo}</p>
              <p>Flow data team_logos: {flowData.team_logos?.length || 0}</p>
              <p>Flow data logo_variants: {flowData.logo_variants?.length || 0}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {generatedLogos.map((logo) => (
                <LogoCard
                  key={logo.id}
                  logo={logo}
                  isSelected={selectedLogo === logo.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info & QR Code Section */}
        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${teamColors.primary}08, ${teamColors.secondary}12, rgba(255,255,255,0.9))`,
            borderColor: `${teamColors.primary}30`
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Contact Form */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Stay Updated
              </h3>
              <p className="text-gray-600 mb-4">
                Get notified about new features and updates for your team.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Subscribe to Updates
                </button>
              </div>
            </div>
            
            {/* QR Code */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Share Your Results
              </h3>
              <p className="text-gray-600 mb-4">
                Share this page with your team or save for later.
              </p>
              {qrCodeUrl && (
                <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                  <Image
                    src={qrCodeUrl}
                    alt="QR Code for results page"
                    width={150}
                    height={150}
                    className="mx-auto"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Scan to return to this page
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            ← Create New Team
          </button>
          
          <button
            onClick={() => selectedLogo && handleDownload(generatedLogos.find(logo => logo.id === selectedLogo)!)}
            disabled={!selectedLogo}
            className="px-6 sm:px-8 py-2 sm:py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            style={{ 
              backgroundColor: teamColors.primary,
              boxShadow: `0 4px 14px 0 ${teamColors.primary}40`
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = teamColors.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = teamColors.primary;
              }
            }}
          >
            Download Selected Logo
          </button>
        </div>
      </div>
    </div>
  );
}
