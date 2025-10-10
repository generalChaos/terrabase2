'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';

export function LogoGeneration() {
  const { state, generateLogos } = useQuestionnaire();
  const hasGenerated = useRef(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  
  // Contact info state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  
  // Player roster state
  const [players, setPlayers] = useState<Array<{id: string, firstName: string, number: string}>>([]);
  const [newPlayerFirstName, setNewPlayerFirstName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5 minutes in seconds

  useEffect(() => {
    if (state.currentStep === 'generating' && state.selectedColors && state.selectedMascot && !hasGenerated.current) {
      hasGenerated.current = true;
      generateLogos();
    }
  }, [state.currentStep, state.selectedColors, state.selectedMascot, generateLogos]);

  // Reset the flag when step changes away from generating
  useEffect(() => {
    if (state.currentStep !== 'generating') {
      hasGenerated.current = false;
    }
  }, [state.currentStep]);

  // Generate QR code for results page
  useEffect(() => {
    if (state.flow?.id) {
      const resultsUrl = `${window.location.origin}/results/${state.flow.id}`;
      console.log('Generating QR code for URL:', resultsUrl); // Debug log
      QRCode.toDataURL(resultsUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      }).then((dataUrl) => {
        console.log('QR code generated successfully'); // Debug log
        setQrCodeDataUrl(dataUrl);
        // Show QR code after a short delay to ensure it's visible
        setTimeout(() => {
          setShowQrCode(true);
        }, 1000);
      }).catch((error) => {
        console.error('QR code generation failed:', error);
      });
    }
  }, [state.flow?.id]);

  // Timer countdown effect
  useEffect(() => {
    if (state.currentStep === 'generating' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state.currentStep, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Generating Your Logo
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Our AI is creating custom logo options for <strong>{state.round1Answers.team_name}</strong>
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          What we&apos;re creating:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span>High-resolution logo designs</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span>Multiple style variations</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span>Age-appropriate design</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span>Sport-specific elements</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-8">
        <div className="flex items-center justify-center space-x-2">
          <span>Estimated time: 3-5 minutes</span>
          {timeRemaining > 0 && (
            <>
              <span>•</span>
              <span className="font-mono text-lg font-semibold text-blue-600">
                {formatTime(timeRemaining)}
              </span>
            </>
          )}
        </div>
      </div>


      {/* Stay Updated Section - FIRST */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8 mt-8">
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

      {/* Player Roster Section */}
      <div className="bg-green-50 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Team Roster
          </h3>
          <button
            onClick={() => setShowPlayerForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Add Player
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Add your team players to generate personalized roster assets like t-shirts and banners. Changes are saved automatically.
        </p>

        {/* Player Form */}
        {showPlayerForm && (
          <form onSubmit={handleAddPlayer} className="bg-white rounded-lg p-4 mb-4 border border-green-200">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 23"
                  required
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map((player) => (
              <div key={player.id} className="bg-white rounded-lg p-3 border border-green-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 text-green-800 text-sm font-semibold px-2 py-1 rounded-full min-w-[2rem] text-center">
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
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>No players added yet</p>
            <p className="text-sm">Add players to generate roster assets</p>
          </div>
        )}

        {players.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            {players.length} player{players.length !== 1 ? 's' : ''} added
          </div>
        )}
      </div>

      {/* QR Code Section - LAST */}
      {qrCodeDataUrl && showQrCode && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200 animate-fade-in shadow-lg">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              📱 Access Your Results Later
            </h3>
            <p className="text-sm text-gray-600">
              Scan this QR code with your phone to access your logo results anytime
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-md border-2 border-purple-300">
              <Image 
                src={qrCodeDataUrl} 
                alt="QR Code for results page" 
                width={160}
                height={160}
                className="w-40 h-40"
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Perfect if you need to step away during generation!</strong>
              </p>
              <div className="text-xs text-gray-600 bg-white rounded-lg px-4 py-2 font-mono break-all border">
                {typeof window !== 'undefined' ? `${window.location.origin}/results/${state.flow?.id}` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Loading State */}
      {state.flow?.id && !qrCodeDataUrl && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Preparing QR code...</span>
          </div>
        </div>
      )}
    </div>
  );
}
