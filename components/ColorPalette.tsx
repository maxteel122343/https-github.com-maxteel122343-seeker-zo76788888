import React from 'react';
import { Color } from '../types';

interface ColorPaletteProps {
  colors: Color[];
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ colors }) => {
  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    // Add a small visual feedback if desired
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-600 mb-2 pl-1">Color Palette:</h4>
      <div className="flex justify-between items-center gap-2 bg-slate-100 p-2 rounded-lg">
        {colors.map((color, index) => (
          <div
            key={index}
            className="group relative w-full h-10 rounded-md cursor-pointer transition-transform hover:scale-110"
            style={{ backgroundColor: color.hex }}
            onClick={() => handleCopy(color.hex)}
            title={`Copy ${color.hex}`}
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              {color.name}<br/>{color.hex}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;