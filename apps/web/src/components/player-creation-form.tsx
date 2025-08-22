"use client";
import { useState } from "react";
import { buttonVariants } from "@party/ui";
import { ChevronLeft, ChevronRight, Grid, List } from "lucide-react";

export type PlayerCreationData = {
  nickname: string;
  avatar: string;
};

const DEFAULT_AVATARS = [
  "😀", "😎", "🤖", "🦄", "🐱", "🐶", "🦁", "🐸", "🐙", "🦋",
  "🌟", "💎", "🔥", "⚡", "🌈", "🍕", "🍦", "🎮", "🎸", "🎨"
];

interface PlayerCreationFormProps {
  onSubmit: (data: PlayerCreationData) => void;
  onCancel?: () => void;
  defaultValues?: Partial<PlayerCreationData>;
  isHost?: boolean;
  roomCode?: string;
  className?: string;
}

export function PlayerCreationForm({
  onSubmit,
  onCancel,
  defaultValues = {},
  isHost = false,
  roomCode,
  className = "",
}: PlayerCreationFormProps) {
  const [nickname, setNickname] = useState(defaultValues.nickname || "");
  const [selectedAvatar, setSelectedAvatar] = useState(defaultValues.avatar || DEFAULT_AVATARS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarViewMode, setAvatarViewMode] = useState<'single' | 'grid'>('single');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setErrors({ nickname: "Nickname is required" });
      return;
    }

    if (nickname.trim().length < 2) {
      setErrors({ nickname: "Nickname must be at least 2 characters" });
      return;
    }

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
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-6xl font-bold text-white tracking-wider mb-4 animate-fade-in-up">
          {isHost ? "CREATE ROOM" : "JOIN ROOM"}
        </h1>
        {roomCode && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3 inline-block mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span className="text-xl font-mono text-white font-bold">{roomCode}</span>
          </div>
        )}
        <p className="text-xl text-slate-300 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {isHost
            ? "Set up your player profile to get started"
            : "Enter your details to join the game"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Selection */}
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">Choose Your Avatar</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarViewMode('single')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    avatarViewMode === 'single' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    avatarViewMode === 'grid' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {avatarViewMode === 'single' ? (
              /* Single Large Avatar with Sideways Sliding */
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
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600 rounded-full flex items-center justify-center text-white hover:text-teal-400 transition-all duration-200 shadow-lg hover:-translate-y-1"
                >
                  <ChevronLeft className="w-6 h-6" />
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
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600 rounded-full flex items-center justify-center text-white hover:text-teal-400 transition-all duration-200 shadow-lg hover:-translate-y-1"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Single Large Avatar Display */}
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 rounded-3xl border-4 border-teal-400 bg-teal-400/20 shadow-2xl flex items-center justify-center animate-scale-in">
                    <div className="text-8xl transition-all duration-300 ease-in-out transform hover:scale-110">
                      {selectedAvatar}
                    </div>
                  </div>
                </div>

                {/* Avatar Counter */}
                <div className="text-center text-sm text-slate-400 mb-4">
                  {DEFAULT_AVATARS.indexOf(selectedAvatar) + 1} of{" "}
                  {DEFAULT_AVATARS.length}
                </div>
              </div>
            ) : (
              /* Grid View of All Avatars */
              <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto p-2">
                {DEFAULT_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`w-16 h-16 rounded-2xl border-2 transition-all duration-200 flex items-center justify-center text-3xl hover:scale-110 ${
                      selectedAvatar === avatar
                        ? 'border-teal-400 bg-teal-400/20 shadow-lg'
                        : 'border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/20'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nickname Input */}
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Your Name</h2>
            
            <div className="space-y-3">
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errors.nickname) {
                    setErrors({});
                  }
                }}
                placeholder="Enter your nickname"
                className={`
                  w-full px-4 py-3 border rounded-xl bg-slate-800 text-white placeholder-slate-400 
                  focus:outline-none focus:ring-2 focus:ring-[--accent] focus:border-transparent transition-all
                  ${errors.nickname ? "border-red-500" : "border-slate-600"}
                `}
                maxLength={20}
                autoComplete="off"
                autoFocus
              />
              
              {errors.nickname && (
                <p className="text-sm text-red-400 animate-fade-in text-center">{errors.nickname}</p>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Nickname</span>
                <span className="text-slate-400">
                  {nickname.length}/20
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className={buttonVariants({
                variant: "secondary",
                size: "xl",
                fullWidth: true,
                animation: "scale"
              })}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !nickname.trim()}
            className={buttonVariants({
              variant: isSubmitting || !nickname.trim() ? "secondary" : "accent",
              size: "xl",
              fullWidth: true,
              animation: "glow",
              className: isSubmitting || !nickname.trim() ? "opacity-50 cursor-not-allowed" : ""
            })}
          >
            {isSubmitting
              ? "Creating..."
              : isHost
                ? "Create Room"
                : "Join Game"}
          </button>
        </div>
      </form>
    </div>
  );
}
