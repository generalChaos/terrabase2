'use client';

import { useState } from 'react';
import { AvatarPreview } from '@/components/ui';
import { ALL_AVATARS, getAvatarDisplayName, type Avatar } from '@/lib/avatar-utils';

export default function AvatarDemo() {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(ALL_AVATARS[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Avatar Gallery</h1>
          <p className="text-slate-300 text-lg">
            Browse through all available avatars for your party game
          </p>
        </div>

        {/* Selected Avatar Preview */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Selected Avatar</h2>
          <div className="flex justify-center">
            <AvatarPreview 
              avatar={selectedAvatar} 
              size="2xl" 
              showBorder={true}
              className="shadow-2xl"
            />
          </div>
          <div className="text-center mt-4">
            <p className="text-white text-lg font-medium">
              {getAvatarDisplayName(selectedAvatar)}
            </p>
          </div>
        </div>

        {/* All Avatars Grid */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">All Available Avatars</h2>
          
          {/* 3x3 Grid Layout */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            {ALL_AVATARS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`group p-4 rounded-2xl transition-all duration-200 hover:scale-105 ${
                  selectedAvatar === avatar 
                    ? 'bg-teal-500/20 border-2 border-teal-400' 
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <AvatarPreview 
                    avatar={avatar} 
                    size="lg" 
                    showBorder={false}
                    className="group-hover:scale-110 transition-transform duration-200"
                  />
                  <span className="text-white text-sm font-medium text-center">
                    {getAvatarDisplayName(avatar)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">How to Use</h2>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-3">Image Avatars</h3>
            <ul className="text-slate-300 space-y-2 max-w-2xl mx-auto">
              <li>• High-quality PNG images with transparent backgrounds</li>
              <li>• Professional and consistent appearance</li>
              <li>• Perfect for branding and visual identity</li>
              <li>• Automatically resized for different display contexts</li>
              <li>• Clean 3x3 grid selection interface</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
