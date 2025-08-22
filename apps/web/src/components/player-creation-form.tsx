'use client';
import { useState } from 'react';

export type PlayerCreationData = {
  nickname: string;
  avatar: string;
};

export type PlayerCreationFormProps = {
  onSubmit: (playerData: PlayerCreationData) => void;
  onCancel?: () => void;
  defaultValues?: Partial<PlayerCreationData>;
  isHost?: boolean;
  roomCode?: string;
  className?: string;
};

// Default avatar options - we can expand this later
const DEFAULT_AVATARS = [
  '👤',
  '👑',
  '🎭',
  '🧠',
  '🎮',
  '🎯',
  '🏆',
  '⭐',
  '🦊',
  '🐱',
  '🐶',
  '🐼',
  '🦁',
  '🐸',
  '🐙',
  '🦄',
];

export function PlayerCreationForm({
  onSubmit,
  onCancel,
  defaultValues = {},
  isHost = false,
  roomCode,
  className = '',
}: PlayerCreationFormProps) {
  const [nickname, setNickname] = useState(defaultValues.nickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState(
    defaultValues.avatar || '👤'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ nickname?: string }>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: { nickname?: string } = {};

    if (!nickname.trim()) {
      newErrors.nickname = 'Please enter a nickname';
    } else if (nickname.trim().length < 2) {
      newErrors.nickname = 'Nickname must be at least 2 characters';
    } else if (nickname.trim().length > 20) {
      newErrors.nickname = 'Nickname must be 20 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    onSubmit({
      nickname: nickname.trim(),
      avatar: selectedAvatar,
    });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white tracking-wider mb-2">
          {isHost ? 'CREATE ROOM' : 'JOIN ROOM'}
        </h1>
        {roomCode && (
          <p className="text-slate-300">
            Room: <span className="font-mono text-teal-400">{roomCode}</span>
          </p>
        )}
        <p className="text-slate-400 mt-2">
          {isHost
            ? 'Set up your player profile to get started'
            : 'Enter your details to join the game'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-3 text-center">
            Choose Your Avatar
          </label>

          {/* Single Large Avatar with Sideways Sliding */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              type="button"
              onClick={() => {
                const currentIndex = DEFAULT_AVATARS.indexOf(selectedAvatar);
                const prevIndex =
                  currentIndex <= 0
                    ? DEFAULT_AVATARS.length - 1
                    : currentIndex - 1;
                setSelectedAvatar(DEFAULT_AVATARS[prevIndex]);
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600 rounded-full flex items-center justify-center text-white hover:text-teal-400 transition-all duration-200 shadow-lg"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => {
                const currentIndex = DEFAULT_AVATARS.indexOf(selectedAvatar);
                const nextIndex =
                  currentIndex >= DEFAULT_AVATARS.length - 1
                    ? 0
                    : currentIndex + 1;
                setSelectedAvatar(DEFAULT_AVATARS[nextIndex]);
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600 rounded-full flex items-center justify-center text-white hover:text-teal-400 transition-all duration-200 shadow-lg"
            >
              →
            </button>

            {/* Single Large Avatar Display */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-3xl border-4 border-teal-400 bg-teal-400/20 shadow-2xl flex items-center justify-center">
                <div className="text-8xl transition-all duration-300 ease-in-out transform hover:scale-110">
                  {selectedAvatar}
                </div>
              </div>
            </div>

            {/* Avatar Counter */}
            <div className="text-center text-sm text-slate-400 mb-4">
              {DEFAULT_AVATARS.indexOf(selectedAvatar) + 1} of{' '}
              {DEFAULT_AVATARS.length}
            </div>
          </div>
        </div>

        {/* Nickname Input */}
        <div>
          <label
            htmlFor="nickname"
            className="block text-sm font-medium text-white mb-2"
          >
            Your Name
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={e => {
              setNickname(e.target.value);
              if (errors.nickname) {
                setErrors({});
              }
            }}
            placeholder="Enter your nickname"
            className={`
              w-full px-4 py-3 border rounded-lg bg-slate-800 text-white placeholder-slate-400 
              focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all
              ${errors.nickname ? 'border-red-500' : 'border-slate-600'}
            `}
            maxLength={20}
            autoComplete="off"
            autoFocus
          />
          {errors.nickname && (
            <p className="mt-2 text-sm text-red-400">{errors.nickname}</p>
          )}
          <p className="mt-1 text-xs text-slate-400 text-right">
            {nickname.length}/20
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 border border-slate-600 rounded-lg text-white hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !nickname.trim()}
            className={`
              flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 transform
              ${
                isSubmitting || !nickname.trim()
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white hover:scale-105 shadow-lg'
              }
            `}
          >
            {isSubmitting
              ? 'Creating...'
              : isHost
                ? 'Create Room'
                : 'Join Game'}
          </button>
        </div>
      </form>
    </div>
  );
}
