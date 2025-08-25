import { HelpCircle } from 'lucide-react';

type QuestionMarkAvatarProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
};

export function QuestionMarkAvatar({ size = 'lg', className = '' }: QuestionMarkAvatarProps) {
  const sizeMap = {
    sm: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
    md: 'w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16',
    lg: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24',
    xl: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28',
    '2xl': 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32'
  };

  const iconSizeMap = {
    sm: 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6',
    md: 'w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8',
    lg: 'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12',
    xl: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
    '2xl': 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16'
  };

  return (
    <div 
      className={`rounded-full bg-slate-700/80 border-2 border-slate-500/60 overflow-hidden transition-all duration-200 flex items-center justify-center ${sizeMap[size]} ${className}`}
    >
      <HelpCircle 
        className={`text-slate-300 ${iconSizeMap[size]}`}
        strokeWidth={2.5}
      />
    </div>
  );
}
