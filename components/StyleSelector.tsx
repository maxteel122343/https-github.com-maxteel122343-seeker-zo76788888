import React from 'react';
import { StyleOption } from '../types';

interface StyleSelectorProps {
  styles: StyleOption[];
  selectedStyle: string | null;
  onSelectStyle: (styleId: string) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ styles, selectedStyle, onSelectStyle }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((style) => (
        <button
          key={style.id}
          onClick={() => onSelectStyle(style.id)}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
            selectedStyle === style.id
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {style.name}
        </button>
      ))}
    </div>
  );
};

export default StyleSelector;
