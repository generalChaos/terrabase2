'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { GeneratedLogo } from '@/lib/services/imageGenerationService';
import QRCode from 'qrcode';
import TShirtModal, { TShirtOrderItem } from './TShirtModal';
import BannerModal from './BannerModal';
import OrderSummary from './OrderSummary';

interface FlowData {
  id: string;
  team_name: string;
  sport: string;
  logo_style: string;
  current_step: string;
  player_roster?: Array<{
    id: string;
    firstName: string;
    number: string;
  }>;
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
      colors?: {
        colors: string[];
        frequencies: number[];
        percentages: number[];
        total_pixels_analyzed: number;
      };
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
      colors?: {
        colors: string[];
        frequencies: number[];
        percentages: number[];
        total_pixels_analyzed: number;
      };
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
  const [selectedLogo, setSelectedLogo] = useState<string | null>(flowData.selected_logo_id || flowData.logo_variants?.[0]?.id || null);
  const [generatedLogos, setGeneratedLogos] = useState<GeneratedLogo[]>([]);
  const [tshirtColor, setTshirtColor] = useState('black');
  const [tshirtSize, setTshirtSize] = useState('M');
  const [bannerColor, setBannerColor] = useState('blue');
  const [bannerSize, setBannerSize] = useState('large');
  const [contactEmail, setContactEmail] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Player roster state
  const [players, setPlayers] = useState<Array<{id: string, firstName: string, number: string}>>(
    flowData.player_roster || []
  );
  const [newPlayerFirstName, setNewPlayerFirstName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [showPlayerForm, setShowPlayerForm] = useState(false);

  // Modal state
  const [showTShirtModal, setShowTShirtModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [orderItems, setOrderItems] = useState<TShirtOrderItem[]>([]);

  // Debug logging
  console.log('🎯 StandaloneLogoResults - flowData:', flowData);
  console.log('🎯 StandaloneLogoResults - player_roster:', flowData?.player_roster);

  // Player management functions
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlayerFirstName.trim() || !newPlayerNumber.trim()) {
      alert('Please enter both first name and number');
      return;
    }

    if (players.some(player => player.number === newPlayerNumber.trim())) {
      alert('This number is already taken. Please choose a different number.');
      return;
    }

    const newPlayer = {
      id: Date.now().toString(),
      firstName: newPlayerFirstName.trim(),
      number: newPlayerNumber.trim()
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    setNewPlayerFirstName('');
    setNewPlayerNumber('');
    setShowPlayerForm(false);

    try {
      const response = await fetch(`/api/flows/${flowData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_roster: updatedPlayers
        })
      });

      if (response.ok) {
        console.log('✅ Player roster saved successfully');
      } else {
        console.error('❌ Failed to save player roster');
      }
    } catch (error) {
      console.error('Error saving player roster:', error);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    const updatedPlayers = players.filter(player => player.id !== playerId);
    setPlayers(updatedPlayers);

    try {
      const response = await fetch(`/api/flows/${flowData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_roster: updatedPlayers
        })
      });

      if (response.ok) {
        console.log('✅ Player roster updated successfully');
      } else {
        console.error('❌ Failed to update player roster');
      }
    } catch (error) {
      console.error('Error updating player roster:', error);
    }
  };

  // Extract team colors from generation prompt
  const getTeamColors = () => {
    console.log('🎨 getTeamColors called - generatedLogos.length:', generatedLogos.length);
    if (!generatedLogos.length) {
      console.log('🎨 No generated logos, using neutral colors');
      return { primary: '#6B7280', secondary: '#9CA3AF', tertiary: '#D1D5DB' }; // Neutral gray colors
    }
    
    // Use selected logo or fallback to first logo
    const logoToUse = selectedLogo || generatedLogos[0]?.id;
    if (!logoToUse) {
      return { primary: '#6B7280', secondary: '#9CA3AF', tertiary: '#D1D5DB' }; // Neutral gray colors
    }
    
    const selectedLogoData = generatedLogos.find(logo => logo.id === logoToUse);
    if (!selectedLogoData) {
      return { primary: '#6B7280', secondary: '#9CA3AF', tertiary: '#D1D5DB' }; // Neutral gray colors
    }
    
    
    // First, try to use extracted colors from asset pack
    console.log('🎨 DEBUG: selectedLogoData.asset_pack:', selectedLogoData.asset_pack);
    console.log('🎨 DEBUG: asset_pack.colors:', selectedLogoData.asset_pack?.colors);
    
    if (selectedLogoData.asset_pack?.colors?.colors && selectedLogoData.asset_pack.colors.colors.length >= 2) {
      const extractedColors = selectedLogoData.asset_pack.colors.colors;
      console.log('🎨 Using extracted colors from asset pack:', extractedColors);
      console.log('🎨 Asset pack colors object:', selectedLogoData.asset_pack.colors);
      const colors = {
        primary: extractedColors[0], // Most frequent color
        secondary: extractedColors[1], // Second most frequent color
        tertiary: extractedColors[2] || extractedColors[0] + '60' // Third most frequent color or primary with transparency
      };
      console.log('🎨 Final team colors:', colors);
      return colors;
    } else {
      console.log('🎨 DEBUG: No extracted colors found, falling back to prompt parsing');
      console.log('🎨 DEBUG: asset_pack exists:', !!selectedLogoData.asset_pack);
      console.log('🎨 DEBUG: colors exists:', !!selectedLogoData.asset_pack?.colors);
      console.log('🎨 DEBUG: colors.colors exists:', !!selectedLogoData.asset_pack?.colors?.colors);
      console.log('🎨 DEBUG: colors.colors length:', selectedLogoData.asset_pack?.colors?.colors?.length);
      console.log('🎨 DEBUG: colors.colors content:', selectedLogoData.asset_pack?.colors?.colors);
      
      // If we have at least 1 color, use it as primary and generate secondary/tertiary
      if (selectedLogoData.asset_pack?.colors?.colors && selectedLogoData.asset_pack.colors.colors.length >= 1) {
        const extractedColors = selectedLogoData.asset_pack.colors.colors;
        console.log('🎨 Using single extracted color and generating variants:', extractedColors[0]);
        const colors = {
          primary: extractedColors[0], // Use the extracted color
          secondary: extractedColors[0] + '80', // Add transparency for secondary
          tertiary: extractedColors[0] + '40' // Add more transparency for tertiary
        };
        console.log('🎨 Generated team colors from single color:', colors);
        return colors;
      }
    }
    
    // Fallback to prompt parsing if no extracted colors available
    if (!selectedLogoData.generation_prompt) {
      return { primary: '#6B7280', secondary: '#9CA3AF', tertiary: '#D1D5DB' }; // Neutral gray colors
    }
    
    const prompt = selectedLogoData.generation_prompt;
    
    // Extract colors from prompt (look for hex codes or color names)
    const hexMatches = prompt.match(/#[0-9A-Fa-f]{6}/g);
    const colorMatches = prompt.match(/\b(red|blue|green|yellow|orange|purple|pink|black|white|navy|maroon|gold|silver)\b/gi);
    
    let primary = '#6B7280'; // Default neutral gray
    let secondary = '#9CA3AF'; // Default neutral gray
    let tertiary = '#D1D5DB'; // Default neutral gray
    
    if (hexMatches && hexMatches.length >= 1) {
      primary = hexMatches[0];
      secondary = hexMatches[1] || primary + '80';
      tertiary = hexMatches[2] || primary + '40';
    } else if (colorMatches && colorMatches.length >= 1) {
      const colorMap: { [key: string]: string } = {
        'red': '#EF4444', 'blue': '#3B82F6', 'green': '#10B981', 'yellow': '#F59E0B',
        'orange': '#F97316', 'purple': '#8B5CF6', 'pink': '#EC4899', 'black': '#1F2937',
        'white': '#F9FAFB', 'navy': '#1E3A8A', 'maroon': '#7C2D12', 'gold': '#D97706', 'silver': '#6B7280'
      };
      primary = colorMap[colorMatches[0].toLowerCase()] || '#6B7280';
      secondary = colorMap[colorMatches[1]?.toLowerCase()] || primary + '80';
      tertiary = colorMap[colorMatches[2]?.toLowerCase()] || primary + '40';
    }
    
    console.log('🎨 Using prompt-parsed colors:', { primary, secondary, tertiary });
    return { primary, secondary, tertiary };
  };

  const teamColors = getTeamColors();
  console.log('🎨 Final team colors being used:', teamColors);
  
  // Force re-render when colors change
  const colorKey = `${teamColors.primary}-${teamColors.secondary}-${teamColors.tertiary}`;

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
      
      const convertedLogo = {
        id: logo.id,
        variant_number: logo.variant_number,
        file_path: '', // Not available in FlowData
        public_url: fixedUrl,
        is_selected: logo.is_selected || false,
        generation_time_ms: logo.generation_time_ms || 0,
        generation_cost_usd: logo.generation_cost_usd || 0,
        generation_prompt: logo.generation_prompt || '',
        model_used: logo.model_used,
        created_at: new Date().toISOString(), // Not available in FlowData
        asset_pack: logo.asset_pack || null
      };
      
      
      return convertedLogo;
    });
    console.log('📊 Converted logos in StandaloneLogoResults:', convertedLogos);
    console.log('📊 First converted logo public_url:', convertedLogos[0]?.public_url);
    setGeneratedLogos(convertedLogos);
    
    // Set the first logo as selected if no logo is currently selected
    if (convertedLogos.length > 0 && !selectedLogo) {
      console.log('🎯 Setting first logo as default selected:', convertedLogos[0].id);
      setSelectedLogo(convertedLogos[0].id);
      
      // Update the converted logos to mark the first one as selected
      const updatedLogos = convertedLogos.map((logo, index) => ({
        ...logo,
        is_selected: index === 0
      }));
      setGeneratedLogos(updatedLogos);
    }
  }, [flowData.team_logos, flowData.logo_variants, flowData, selectedLogo]);

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

  // Modal handlers
  const handleAddToOrder = (orderItem: TShirtOrderItem) => {
    setOrderItems(prev => [...prev, orderItem]);
    setShowOrderSummary(true);
  };

  const handleRemoveFromOrder = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSendEmail = () => {
    setShowOrderSummary(false);
    // Email is sent via the OrderSummary component
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
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
            <div className="text-gray-400 text-xs">No Logo</div>
          </div>
        )}
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
      key={colorKey}
      className="min-h-screen py-8 px-4"
      style={{
        background: `linear-gradient(135deg, ${teamColors.secondary}25, ${teamColors.primary}15, ${teamColors.tertiary || teamColors.secondary}10)`
      }}
    >
      <div className="max-w-6xl mx-auto">

        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border backdrop-blur-sm"
          style={{
            background: `linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85), rgba(255,255,255,0.9))`,
            borderColor: `${teamColors.primary}30`
          }}
        >
          <div className="flex flex-col sm:flex-row lg:flex-row gap-4 sm:gap-6">
            {/* Team Logo Display */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                {selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.clean_logo_url ? (
                  <Image
                    src={generatedLogos.find(logo => logo.id === selectedLogo)!.asset_pack!.clean_logo_url!}
                    alt="Selected team logo"
                    width={224}
                    height={224}
                    className="object-contain"
                  />
                ) : selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.public_url ? (
                  <Image
                    src={generatedLogos.find(logo => logo.id === selectedLogo)!.public_url}
                    alt="Selected team logo"
                    width={224}
                    height={224}
                    className="object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-xs sm:text-sm">Select Logo</div>
                )}
              </div>
            </div>
            
            {/* Team Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-2" style={{ 
                fontFamily: 'Impact, Arial Black, sans-serif', 
                letterSpacing: '0.05em',
                color: teamColors.primary
              }}>
                {flowData.team_name.toUpperCase()}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <p className="text-lg sm:text-xl text-gray-600 font-semibold">
                  {flowData.sport.toUpperCase()}
                </p>
                {/* Team Color Swatches */}
                <div key={`swatches-${colorKey}`} className="flex gap-2">
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: teamColors.primary }}
                    title={`Primary: ${teamColors.primary}`}
                  />
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: teamColors.secondary }}
                    title={`Secondary: ${teamColors.secondary}`}
                  />
                  {teamColors.tertiary && (
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: teamColors.tertiary }}
                      title={`Tertiary: ${teamColors.tertiary}`}
                    />
                  )}
                </div>
              </div>

              {/* Player Roster */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900" style={{ color: teamColors.primary }}>
                    ROSTER
                  </h3>
                  {players.length === 0 && (
      <button
        onClick={() => setShowPlayerForm(true)}
        className="px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
        style={{ backgroundColor: teamColors.primary }}
      >
        Add Players
      </button>
                  )}
                </div>
                
                {/* Player Form */}
                {showPlayerForm && (
                  <form
                    onSubmit={handleAddPlayer}
                    className="bg-white p-4 rounded-lg border-2 mb-4"
                    style={{ 
                      borderColor: `${teamColors.primary}30`,
                      background: `linear-gradient(135deg, ${teamColors.secondary}15, ${teamColors.primary}08, ${teamColors.tertiary || teamColors.secondary}05)`
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={newPlayerFirstName}
                          onChange={(e) => setNewPlayerFirstName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter first name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jersey Number
                        </label>
                        <input
                          type="text"
                          value={newPlayerNumber}
                          onChange={(e) => setNewPlayerNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter number"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: teamColors.primary }}
                      >
                        Add Player
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPlayerForm(false)}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Players Grid */}
                {players.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {players.map((player) => (
                      <div 
                        key={player.id} 
                        className="bg-white p-3 rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow group"
                        style={{ 
                          borderColor: `${teamColors.primary}30`,
                          background: `linear-gradient(135deg, ${teamColors.secondary}15, ${teamColors.primary}08, ${teamColors.tertiary || teamColors.secondary}05)`
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: teamColors.primary }}
                          >
                            {player.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p 
                              className="font-normal text-gray-600 truncate"
                              style={{ 
                                fontFamily: 'Impact, Arial Black, sans-serif',
                                letterSpacing: '0.05em',
                                fontSize: '1.3rem'
                              }}
                            >
                              {player.firstName.toUpperCase()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemovePlayer(player.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                            title="Remove player"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowPlayerForm(true)}
                      className="bg-white p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center text-gray-500 hover:text-gray-700"
                    >
                      <span className="text-2xl">+</span>
                    </button>
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>

        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border backdrop-blur-sm"
          style={{
            background: `linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85), rgba(255,255,255,0.9))`,
            borderColor: `${teamColors.secondary}30`
          }}
        >
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* A) Banner Image */}
            <div>
              <div className="bg-gray-100 rounded-lg p-4 mb-4" style={{ height: '500px' }}>
                {selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.banner_url ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image
                      src={generatedLogos.find(logo => logo.id === selectedLogo)!.asset_pack!.banner_url!}
                      alt="Team banner"
                      width={600}
                      height={500}
                      className="max-w-full max-h-full object-contain rounded-xl"
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
              <div className="flex justify-center">
                <button 
                  onClick={() => setShowBannerModal(true)}
                  className="text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${teamColors.primary}, ${teamColors.primary}CC)`,
                    boxShadow: `0 4px 14px 0 ${teamColors.secondary}40`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = teamColors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = teamColors.secondary;
                  }}
                >
                  Add Banner
                </button>
              </div>
            </div>

            {/* B) T-Shirt Image */}
            <div>
              <div className="bg-gray-100 rounded-lg p-4 mb-4 flex items-center justify-center relative" style={{ height: '500px' }}>
                {selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.tshirt_front_url ? (
                  <Image
                    src={generatedLogos.find(logo => logo.id === selectedLogo)!.asset_pack!.tshirt_front_url!}
                    alt="T-shirt"
                      width={600}
                      height={500}
                    className="max-w-full max-h-full object-contain rounded-xl"
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
                  <div className="text-4xl mb-2">👕</div>
                  <p className="text-sm">T-shirt preview</p>
                  <p className="text-xs text-gray-400">Coming soon</p>
                </div>
                
                {/* Color Swatches */}
                <div className="absolute flex gap-2" style={{ bottom: '20px', left: '20px' }}>
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: '#ffffff' }}
                    title="White"
                  />
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: '#000000' }}
                    title="Black"
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={() => setShowTShirtModal(true)}
                  className="text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg flex items-center space-x-2"
                  style={{ 
                    background: `linear-gradient(135deg, ${teamColors.primary}, ${teamColors.primary}CC)`,
                    boxShadow: `0 4px 14px 0 ${teamColors.secondary}40`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = teamColors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = teamColors.secondary;
                  }}
                >
                  <span>Add T-Shirt</span>
                  {orderItems.length > 0 && (
                    <span className="bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                      {orderItems.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Selection & Download */}
        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border backdrop-blur-sm"
          style={{
            background: `linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85), rgba(255,255,255,0.9))`,
            borderColor: `${teamColors.primary}30`
          }}
        >
          
          {/* Logo Options */}
          <div className="mb-4 sm:mb-6">
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
          
          {/* Download Button */}
          {selectedLogo && (generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.clean_logo_url || generatedLogos.find(logo => logo.id === selectedLogo)?.public_url) && (
            <div className="text-center">
              <button 
                onClick={() => selectedLogo && handleDownload(generatedLogos.find(logo => logo.id === selectedLogo)!)}
                className="text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg transition-colors font-semibold text-sm sm:text-base"
                style={{ 
                  background: `linear-gradient(135deg, ${teamColors.primary}, ${teamColors.primary}CC)`,
                  boxShadow: `0 4px 14px 0 ${teamColors.secondary}40`
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${teamColors.secondary}, ${teamColors.secondary}CC)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${teamColors.primary}, ${teamColors.primary}CC)`;
                  }}
              >
                Download Selected Logo
              </button>
            </div>
          )}
        </div>

        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border backdrop-blur-sm"
          style={{
            background: `rgba(255,255,255,1)`,
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
              boxShadow: `0 4px 14px 0 ${teamColors.secondary}40`
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

      {/* T-Shirt Modal */}
      <TShirtModal
        isOpen={showTShirtModal}
        onClose={() => setShowTShirtModal(false)}
        teamLogo={selectedLogo ? (generatedLogos.find(logo => logo.id === selectedLogo)?.public_url || '') : ''}
        cleanLogoUrl={selectedLogo ? (generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.clean_logo_url || '') : ''}
        tshirtFrontUrl={selectedLogo ? (generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.tshirt_front_url || '') : ''}
        tshirtBackUrl={selectedLogo ? (generatedLogos.find(logo => logo.id === selectedLogo)?.asset_pack?.tshirt_back_url || '') : ''}
        teamName={flowData.team_name}
        teamColors={teamColors}
        playerRoster={players.map(p => ({ id: p.id, firstName: p.firstName, lastName: '', number: parseInt(p.number) }))}
        onAddToOrder={handleAddToOrder}
        onAddPlayer={(firstName, number) => {
          const newPlayer = {
            id: Date.now().toString(),
            firstName: firstName,
            number: number
          };
          setPlayers([...players, newPlayer]);
        }}
        onViewOrder={() => {
          setShowTShirtModal(false);
          setShowOrderSummary(true);
        }}
      />

      {/* Banner Modal */}
      <BannerModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
      />

      {/* Order Summary Modal */}
      <OrderSummary
        isOpen={showOrderSummary}
        onClose={() => setShowOrderSummary(false)}
        orderItems={orderItems}
        onRemoveItem={handleRemoveFromOrder}
        onSendEmail={handleSendEmail}
      />
    </div>
  );
}
