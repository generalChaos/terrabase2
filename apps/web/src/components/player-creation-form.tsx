"use client";
import { useState } from "react";
import { ALL_AVATARS, getRandomAvatarAndName, type Avatar } from "@/lib/avatar-utils";
import Image from "next/image";

export type PlayerCreationData = {
  nickname: string;
  avatar: string;
};

interface PlayerCreationFormProps {
  onSubmit: (data: PlayerCreationData) => void;
  onCancel?: () => void;
  defaultValues?: Partial<PlayerCreationData>;
  isHost?: boolean;
  className?: string;
}

export function PlayerCreationForm({
  onSubmit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCancel,
  defaultValues = {},
  isHost = false,
  className = "",
}: PlayerCreationFormProps) {
  
  const [nickname, setNickname] = useState(defaultValues.nickname || "");
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(defaultValues.avatar as Avatar || ALL_AVATARS[0]);
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



  const handleRandomize = () => {
    const { avatar, name } = getRandomAvatarAndName();
    setSelectedAvatar(avatar);
    setNickname(name);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Combined Avatar Selection and Name Input */}
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-2 px-2">
            {/* Avatar Selection */}
            <div className="text-center mb-4">
              {/* 3x3 Avatar Grid with Responsive Spacing */}
              <div className="grid grid-cols-3 gap-1 md:gap-2 lg:gap-3 mb-4 max-w-lg mx-auto bg-slate-900/80 rounded-2xl p-4">
                {ALL_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className="group p-1 md:p-2 rounded-2xl transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex flex-col items-center space-y-0.5">
                      {/* Circular Avatar Container - Responsive Sizing */}
                      <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                        selectedAvatar === avatar
                          ? 'bg-slate-800/80 border-teal-400'
                          : 'bg-slate-900/80 border-slate-700 group-hover:bg-slate-800/80 group-hover:border-slate-600'
                      }`}>
                        <Image
                          src={`/avatars/${avatar}`}
                          alt={`Avatar ${avatar}`}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2 px-2">
              <label htmlFor="nickname" className="block text-lg font-medium text-white">
                Name
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errors.nickname) {
                    setErrors({});
                  }
                }}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200"
                placeholder="Enter your nickname"
                maxLength={20}
                required
                autoComplete="off"
                autoFocus
              />
              {errors.nickname && (
                <p className="text-red-400 text-sm">{errors.nickname}</p>
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
        <div className="flex flex-col sm:flex-row-reverse gap-3 sm:gap-4 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <button
            type="submit"
            disabled={isSubmitting || !nickname.trim()}
            className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-2xl text-white font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? "Creating..." : isHost ? "Create Room" : "Join Room"}
          </button>
          <button
            type="button"
            onClick={handleRandomize}
            className="w-full sm:flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-2xl text-white font-medium transition-all duration-200 hover:scale-105"
          >
            Randomize
          </button>
        </div>
      </form>
    </div>
  );
}