'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';
import { GeneratedLogo } from '@/lib/services/imageGenerationService';
import QRCode from 'qrcode';

interface LogoResultsProps {
  onLogoSelect: (logoId: string) => void;
}

export default function LogoResults({ onLogoSelect }: LogoResultsProps) {
  const { state, dispatch } = useQuestionnaire();
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [generatedLogos, setGeneratedLogos] = useState<GeneratedLogo[]>([]);
  const [tshirtColor, setTshirtColor] = useState('black');
  const [tshirtSize, setTshirtSize] = useState('M');
  const [bannerColor, setBannerColor] = useState('blue');
  const [bannerSize, setBannerSize] = useState('large');

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
  
  // Contact info state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showContactForm, setShowContactForm] = useState(false);
  
  // Player roster state
  const [players, setPlayers] = useState<Array<{id: string, firstName: string, number: string}>>([]);
  const [newPlayerFirstName, setNewPlayerFirstName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  
  const generateQRCode = useCallback(async () => {
    try {
      const resultsUrl = `${window.location.origin}/results/${state.flow?.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(resultsUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, [state.flow?.id]);

  useEffect(() => {
    // Generate QR code for the results page
    generateQRCode();
  }, [generateQRCode]);

  // Watch for logo variants from context
  useEffect(() => {
    if (state.logoVariants && state.logoVariants.length > 0) {
      console.log('✅ Logo variants received from context:', state.logoVariants.length);
      console.log('📊 Logo variants data:', state.logoVariants);
      // Convert LogoVariant[] to GeneratedLogo[]
      const convertedLogos = state.logoVariants.map(variant => {
        console.log(`📊 Converting variant ${variant.variant_number}:`, {
          id: variant.id,
          public_url: variant.public_url,
          model_used: variant.model_used
        });
        
        // Fix the URL structure - remove duplicate team-logos/ prefix if present
        let fixedUrl = variant.public_url || '';
        if (fixedUrl && fixedUrl.includes('/team-logos/team-logos/')) {
          fixedUrl = fixedUrl.replace('/team-logos/team-logos/', '/team-logos/');
          console.log(`🔧 Fixed URL for variant ${variant.variant_number}:`, fixedUrl);
        }
        
        return {
          ...variant,
          public_url: fixedUrl,
          asset_pack: variant.asset_pack || null
        };
      });
      console.log('📊 Converted logos:', convertedLogos);
      setGeneratedLogos(convertedLogos);
      setSelectedLogo(state.logoVariants[0].id);
    }
  }, [state.logoVariants]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !phone) {
      alert('Please fill in both email and phone number');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_id: state.flow?.id,
          email: email,
          phone: phone
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowContactForm(false);
        alert('Contact info saved! We\'ll notify you when your logos are ready.');
      } else {
        throw new Error(result.error || 'Failed to save contact info');
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert('Failed to save contact info. Please try again.');
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlayerFirstName.trim() || !newPlayerNumber.trim()) {
      alert('Please enter both first name and number');
      return;
    }

    // Check if number is already taken
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

    // Auto-save roster to database
    try {
      const response = await fetch(`/api/flows/${state.flow?.id}`, {
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

    // Auto-save roster to database
    try {
      const response = await fetch(`/api/flows/${state.flow?.id}`, {
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



  const handleLogoSelect = (logoId: string) => {
    setSelectedLogo(logoId);
    onLogoSelect(logoId);
  };


  const LogoCard = ({ logo, isSelected }: { logo: GeneratedLogo; isSelected: boolean }) => {
    const hasRealImage = logo.public_url && logo.model_used !== 'loading';
    
    console.log(`🎨 LogoCard ${logo.variant_number}:`, {
      id: logo.id,
      public_url: logo.public_url,
      model_used: logo.model_used,
      hasRealImage
    });
    
    return (
      <div 
        className={`bg-white rounded-lg p-4 border-2 transition-all cursor-pointer ${
          isSelected 
            ? 'border-blue-500 shadow-lg' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => logo.public_url && handleLogoSelect(logo.id)}
      >
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
          {logo.public_url ? (
            <div className="w-full h-full relative">
              <Image
                src={logo.public_url}
                alt="Team logo"
                fill
                className="object-contain"
                onLoad={() => console.log(`✅ Logo ${logo.variant_number} loaded successfully`)}
                onError={() => console.error(`❌ Failed to load logo ${logo.variant_number}`)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400 text-xs">Loading...</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen py-8"
      style={{
        backgroundColor: teamColors.primary
      }}
    >
      <div className="max-w-6xl mx-auto px-4">

        {/* Section 1: Team Information & Roster */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm border">
          <div className="flex flex-col sm:flex-row lg:flex-row gap-4 sm:gap-6">
            {/* Team Logo Display */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                {selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.public_url ? (
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
                {state.round1Answers.team_name}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-4">
                {state.round1Answers.sport} Team
              </p>
              
              {/* Player Roster */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Player Roster
                  </h3>
                  <button
                    onClick={() => setShowPlayerForm(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Player
                  </button>
                </div>
                
                {/* Player Form */}
                {showPlayerForm && (
                  <form onSubmit={handleAddPlayer} className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name / Nickname
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={newPlayerFirstName}
                          onChange={(e) => setNewPlayerFirstName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Mike or Lightning"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="playerNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Jersey Number
                        </label>
                        <input
                          type="text"
                          id="playerNumber"
                          value={newPlayerNumber}
                          onChange={(e) => setNewPlayerNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 23"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Player
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPlayerForm(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Players List */}
                {players.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {players.map((player) => (
                      <div key={player.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-2 py-1 rounded-full min-w-[2rem] text-center">
                            {player.number}
                          </div>
                          <span className="text-gray-900 font-medium">{player.firstName}</span>
                        </div>
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <div className="text-2xl mb-1">👥</div>
                    <p className="text-sm">No players added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Asset Customization */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm border">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Customize Your Assets</h2>
          
          <div className="space-y-8">
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
                      <p className="text-sm">Team roster banner preview</p>
                      <p className="text-xs text-gray-400 mt-1">Will show your logo and player roster</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <p className="text-sm">Team roster banner preview</p>
                      <p className="text-xs text-gray-400 mt-1">Will show your logo and player roster</p>
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
              <button className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Add Banner
              </button>
            </div>

            {/* B) T-Shirt Image */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">B) T-Shirt Image</h3>
              <div className="flex flex-col sm:flex-row lg:flex-row gap-4">
                {/* T-Shirt Preview */}
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center" style={{ height: '400px', width: '300px' }}>
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">👕</div>
                      <p className="text-sm">T-shirt preview</p>
                      <p className="text-xs text-gray-400">Coming soon</p>
                    </div>
                  </div>
                </div>
                
                {/* T-Shirt Controls */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <select 
                        value={tshirtColor}
                        onChange={(e) => setTshirtColor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="black">Black</option>
                        <option value="white">White</option>
                        <option value="navy">Navy</option>
                        <option value="red">Red</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <select 
                        value={tshirtSize}
                        onChange={(e) => setTshirtSize(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="S">S (34-36&rdquo;)</option>
                        <option value="M">M (38-40&rdquo;)</option>
                        <option value="L">L (42-44&rdquo;)</option>
                        <option value="XL">XL (46-48&rdquo;)</option>
                        <option value="XXL">XXL (50-52&rdquo;)</option>
                        <option value="XXXL">XXXL (54-56&rdquo;)</option>
                      </select>
                    </div>
                  </div>
                  
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Add T-Shirts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Section 3: Logo Selection & Download */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm border">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Choose Your Logo</h2>
          
          {/* Selected Logo Display */}
          {selectedLogo && generatedLogos.find(logo => logo.id === selectedLogo)?.public_url && (
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Image
                  src={generatedLogos.find(logo => logo.id === selectedLogo)!.public_url}
                  alt="Selected team logo"
                  width={288}
                  height={288}
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {state.round1Answers.team_name}
              </h3>
              <button className="bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base">
                Download Selected Logo
              </button>
            </div>
          )}
          
          {/* Alternative Logo Options */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Alternative Options</h3>
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
        <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Contact Form */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Stay Updated
              </h3>
              <p className="text-gray-600 mb-4">
                Logo generation can take a few minutes. Leave your contact info and we&apos;ll notify you when your logos are ready!
              </p>
              
              {!showContactForm ? (
                <button
                  onClick={() => setShowContactForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Contact Info
                </button>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Contact Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* QR Code */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Access
              </h3>
              <p className="text-gray-600 mb-4">
                Scan this QR code to return to your results page anytime
              </p>
              
              {qrCodeUrl ? (
                <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                  <Image 
                    src={qrCodeUrl} 
                    alt="QR Code for results page"
                    width={200}
                    height={200}
                    className="w-32 h-32 mx-auto"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                  <div className="text-gray-400 text-sm">Generating QR...</div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Save this page to return later
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 'round2' })}
            className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            ← Back to Colors & Mascot
          </button>
          
          <button
            onClick={() => selectedLogo && onLogoSelect(selectedLogo)}
            disabled={!selectedLogo}
            className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            Continue with Selected Logo
          </button>
        </div>

      </div>
    </div>
  );
}
