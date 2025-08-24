import { ReactNode } from 'react';

interface ControlSection {
  title: string;
  icon: string;
  color: string;
  children: ReactNode;
}

interface ControlsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  sections: ControlSection[];
  className?: string;
}

export function ControlsOverlay({ isOpen, onClose, sections, className = "" }: ControlsOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className={`absolute top-16 right-4 z-40 bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 max-w-sm w-80 shadow-2xl border border-gray-600 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">🎛️ Controls</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Progressive Controls Layout */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {sections.map((section, index) => (
          <div key={index} className="bg-gray-700/50 rounded-lg p-3">
            <h5 className={`text-sm font-semibold mb-3 ${section.color}`}>
              {section.icon} {section.title}
            </h5>
            <div className="space-y-3">
              {section.children}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
