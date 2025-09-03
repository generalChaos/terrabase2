interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
}

export function RangeControl({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  onChange, 
  unit = "", 
  className = "" 
}: RangeControlProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-1">
        {label}: {value}{unit}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

interface SelectControlProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

export function SelectControl({ 
  label, 
  value, 
  options, 
  onChange, 
  className = "" 
}: SelectControlProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorControl({ 
  label, 
  value, 
  onChange, 
  className = "" 
}: ColorControlProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 bg-gray-600 border border-gray-500 rounded cursor-pointer"
      />
    </div>
  );
}

interface CheckboxControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function CheckboxControl({ 
  label, 
  checked, 
  onChange, 
  className = "" 
}: CheckboxControlProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3 h-3 text-blue-600 bg-gray-600 border-gray-500 rounded"
      />
      <label className="text-xs">{label}</label>
    </div>
  );
}
