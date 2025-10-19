import React from 'react';

interface ToggleSwitchProps {
  label: string;
  onToggle: (isChecked: boolean) => void;
  isChecked?: boolean;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, onToggle, isChecked, disabled = false }) => {

  const handleToggle = () => {
    if (disabled) return;
    onToggle(!isChecked);
  };

  return (
    <label className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <div className="relative">
        <input 
            type="checkbox" 
            className="sr-only" 
            checked={isChecked} 
            onChange={handleToggle}
            disabled={disabled}
        />
        <div className={`block w-14 h-8 rounded-full transition-colors ${isChecked ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isChecked ? 'transform translate-x-6' : ''}`}></div>
      </div>
      <div className="ml-3 text-gray-700 text-sm">{label}</div>
    </label>
  );
};

export default ToggleSwitch;