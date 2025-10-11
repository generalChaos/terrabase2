'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

interface TShirtModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamLogo: string;
  cleanLogoUrl?: string;
  tshirtFrontUrl?: string;
  tshirtBackUrl?: string;
  teamName: string;
  teamColors: {
    primary: string;
    secondary: string;
  };
  playerRoster: Array<{
    id: string;
    firstName: string;
    lastName: string;
    number?: number;
  }>;
  onAddToOrder: (orderItem: TShirtOrderItem) => void;
  onAddPlayer?: (firstName: string, number: string) => void;
  onViewOrder?: () => void;
}

export interface TShirtOrderItem {
  id: string;
  type: 'tshirt';
  size: string;
  color: string;
  backOption: 'blank' | 'team_roster' | 'player_name' | 'player_name_number';
  selectedPlayer?: {
    id: string;
    firstName: string;
    lastName: string;
    number?: number;
  };
  quantity: number;
  logoUrl: string;
  teamName: string;
  description: string;
}

const T_SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const T_SHIRT_COLORS = [
  // Most Popular Colors (Classic & Versatile)
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Sport Grey', hex: '#A8A8A8' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Royal', hex: '#4169E1' },
  { name: 'Navy', hex: '#000080' }, // Adding Navy as it's very popular
  
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

const BACK_OPTIONS = [
  { value: 'blank', label: 'Blank' },
  { value: 'team_roster', label: 'Team Roster' },
  { value: 'player_name', label: 'Player Name' },
  { value: 'player_name_number', label: 'Player Name & Number' }
];

export default function TShirtModal({
  isOpen,
  onClose,
  teamLogo,
  cleanLogoUrl,
  tshirtFrontUrl,
  tshirtBackUrl,
  teamName,
  teamColors,
  playerRoster,
  onAddToOrder,
  onAddPlayer,
  onViewOrder
}: TShirtModalProps) {
  const [selectedSize, setSelectedSize] = useState('L');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedBackOption, setSelectedBackOption] = useState<'blank' | 'team_roster' | 'player_name' | 'player_name_number'>('blank');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  
  // New player form state
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [newPlayerFirstName, setNewPlayerFirstName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');

  const handleBackOptionChange = (option: 'blank' | 'team_roster' | 'player_name' | 'player_name_number') => {
    setSelectedBackOption(option);
    setShowPlayerSelection(option === 'player_name' || option === 'player_name_number');
    if (option === 'blank' || option === 'team_roster') {
      setSelectedPlayer('');
    }
  };

  const [showToast, setShowToast] = useState(false);

  const handleAddNewPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlayerFirstName.trim() || !newPlayerNumber.trim()) {
      alert('Please enter both first name and number');
      return;
    }

    if (playerRoster.some(player => player.number === parseInt(newPlayerNumber.trim()))) {
      alert('This number is already taken. Please choose a different number.');
      return;
    }

    if (onAddPlayer) {
      onAddPlayer(newPlayerFirstName.trim(), newPlayerNumber.trim());
      
      // Reset form
      setNewPlayerFirstName('');
      setNewPlayerNumber('');
      setShowNewPlayerForm(false);
      
      // Show success message
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleAddToOrder = () => {
    const orderItem: TShirtOrderItem = {
      id: `tshirt-${Date.now()}`,
      type: 'tshirt',
      size: selectedSize,
      color: selectedColor,
      backOption: selectedBackOption,
      selectedPlayer: selectedPlayer ? playerRoster.find(p => p.id === selectedPlayer) : undefined,
      quantity,
      logoUrl: teamLogo,
      teamName,
      description: "Front: Team Logo left chest. Logo size adjusted by shirt size."
    };

    onAddToOrder(orderItem);
    
    // Show toast notification
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Reset form for next item
    setSelectedSize('L');
    setSelectedColor('Black');
    setSelectedBackOption('blank');
    setSelectedPlayer('');
    setQuantity(1);
    setShowPlayerSelection(false);
  };

  const selectedColorHex = T_SHIRT_COLORS.find(c => c.name === selectedColor)?.hex || '#000000';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Create Team Shirts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Preview */}
            <div className="space-y-6">
              <div>
                <div className="relative bg-gray-100 rounded-lg p-8 flex justify-center">
                  {/* T-shirt mockup with selected color background */}
                  <div 
                    className="w-64 h-80 rounded-lg border-4 border-gray-300 flex items-center justify-center relative"
                    style={{ backgroundColor: selectedColorHex }}
                  >
                    {/* Team logo in center */}
                    <div className="w-64 h-64 rounded-lg p-3">
                      <Image
                        src={cleanLogoUrl || teamLogo}
                        alt={`${teamName} logo`}
                        width={256}
                        height={256}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* Sample T-shirt Image */}
              <div className="flex justify-center">
                {tshirtFrontUrl ? (
                  /* Use actual asset pack t-shirt image */
                  <div className="relative">
                    <Image
                      src={tshirtFrontUrl}
                      alt={`${teamName} t-shirt front`}
                      width={400}
                      height={400}
                      className="w-80 h-80 object-contain rounded-lg"
                    />
                    
                    {/* Size overlay */}
                    <div className="absolute top-2 left-2">
                      <div className="bg-white bg-opacity-90 rounded px-2 py-1">
                        <span className="text-xs font-semibold text-gray-700">{selectedSize}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Fallback to custom preview if no asset pack image */
                  <div 
                    className="w-64 h-72 rounded-lg flex items-center justify-center relative"
                    style={{ backgroundColor: selectedColorHex }}
                  >
                    <div className="w-52 h-60 bg-white rounded-lg p-3">
                      <Image
                        src={cleanLogoUrl || teamLogo}
                        alt={`${teamName} logo on t-shirt`}
                        width={208}
                        height={208}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    
                    <div className="absolute top-2 left-2 right-2">
                      <div className="bg-white bg-opacity-80 rounded px-2 py-1 text-center">
                        <span className="text-xs font-semibold text-gray-700">{selectedSize}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Customization Options */}
            <div className="space-y-6">
              {/* Size Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Size</h3>
                <div className="grid grid-cols-3 gap-2">
                  {T_SHIRT_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Color</h3>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: selectedColorHex }}
                    />
                    <span className="text-sm font-medium text-gray-700">{selectedColor}</span>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                  {T_SHIRT_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`p-2 rounded-lg border-2 transition-all flex items-center justify-center ${
                        selectedColor === color.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={color.name}
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Back Option Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Back Option</h3>
                <div className="space-y-2">
                  {BACK_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="backOption"
                        value={option.value}
                        checked={selectedBackOption === option.value}
                        onChange={() => handleBackOptionChange(option.value as any)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>

                {/* Player Selection */}
                {showPlayerSelection && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Select Player</h4>
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a player...</option>
                      {playerRoster.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.firstName} {player.lastName} {player.number ? `#${player.number}` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNewPlayerForm(!showNewPlayerForm)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Add New Player
                    </button>
                    
                    {/* New Player Form */}
                    {showNewPlayerForm && (
                      <form
                        onSubmit={handleAddNewPlayer}
                        className="mt-4 p-4 bg-white rounded-lg border border-gray-200"
                      >
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Add New Player</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={newPlayerFirstName}
                              onChange={(e) => setNewPlayerFirstName(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter name"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Number
                            </label>
                            <input
                              type="number"
                              value={newPlayerNumber}
                              onChange={(e) => setNewPlayerNumber(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter number"
                              min="1"
                              max="99"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            type="submit"
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Add Player
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewPlayerForm(false);
                              setNewPlayerFirstName('');
                              setNewPlayerNumber('');
                            }}
                            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Add to Order Button */}
              <button
                onClick={handleAddToOrder}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <ShoppingCart size={20} className="mr-2" />
                Add to Order
              </button>
              
              {/* View Order Button */}
              <button
                onClick={onViewOrder || onClose}
                className="w-full bg-gray-500 text-white py-2 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors mt-2"
              >
                View Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="font-medium">Added to order!</span>
        </div>
      )}
    </div>
  );
}

