"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  className?: string;
}

export function PlayerCreationForm({
  onSubmit,
  onCancel,
  defaultValues = {},
  isHost = false,
  className = "",
}: PlayerCreationFormProps) {
  const [nickname, setNickname] = useState(defaultValues.nickname || "");
  const [selectedAvatar, setSelectedAvatar] = useState(defaultValues.avatar || DEFAULT_AVATARS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Selection and Name Input Combined */}
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">Choose Your Avatar</h2>
            </div>

            {/* Single Large Avatar with Sideways Sliding */}
            <div className="relative mb-8">
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
                    <div style={{ fontSize: 'var(--avatar-font-2xl)' }} className="transition-all duration-300 ease-in-out transform hover:scale-110">
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

            {/* Name Input */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white text-center">Your Name</h3>
              
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
              className="flex-1 py-4 px-6 rounded-2xl bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/50 text-white font-bold text-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !nickname.trim()}
            className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-glow active:translate-y-0 ${
              isSubmitting || !nickname.trim()
                ? "bg-slate-600/50 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg"
            }`}
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