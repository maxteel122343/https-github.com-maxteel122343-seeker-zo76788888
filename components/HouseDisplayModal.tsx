import React from 'react';
import { CloseIcon } from './Icons';

interface HouseDisplayModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const HouseDisplayModal: React.FC<HouseDisplayModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] p-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors z-10">
          <CloseIcon className="w-6 h-6" />
        </button>
        
        <div className="w-full h-full flex items-center justify-center">
            <img src={imageUrl} alt="Generated House Exterior" className="w-full h-full object-contain rounded-lg max-h-[85vh]"/>
        </div>
      </div>
    </div>
  );
};

export default HouseDisplayModal;