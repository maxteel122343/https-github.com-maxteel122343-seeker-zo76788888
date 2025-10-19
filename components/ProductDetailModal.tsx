import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { CloseIcon, PencilIcon, SaveIcon, ShareIcon } from './Icons';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onShare: (product: Product) => void;
  onUpdateLink: (product: Product, newUrl: string) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onShare, onUpdateLink }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    if (product) {
      setLink(product.customPurchaseUrl || product.purchaseUrl);
      setIsEditing(false);
    }
  }, [product]);

  if (!product) return null;

  const handleSaveLink = () => {
    onUpdateLink(product, link);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col md:flex-row gap-6 p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
          <CloseIcon className="w-6 h-6" />
        </button>
        
        <div className="md:w-1/2 bg-slate-100 rounded-lg flex items-center justify-center p-4">
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain max-h-80"/>
        </div>

        <div className="md:w-1/2 flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800">{product.name}</h2>
            <p className="text-slate-600 mt-2 mb-4 flex-grow">{product.description}</p>
            
            <div className="space-y-3">
              {isEditing ? (
                  <div className="flex gap-2">
                      <input 
                          type="text"
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          className="flex-grow p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter your affiliate link"
                      />
                      <button 
                        onClick={handleSaveLink}
                        className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        title="Save link"
                      >
                          <SaveIcon className="w-5 h-5" />
                      </button>
                  </div>
              ) : (
                <div className="flex gap-2">
                    <a 
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-grow bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-all text-center"
                    >
                        Buy Now
                    </a>
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="p-3 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                        title="Edit link"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                </div>
              )}

              <button 
                onClick={() => onShare(product)}
                className="w-full flex items-center justify-center gap-2 bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-sky-600 transition-all text-center"
              >
                <ShareIcon className="w-5 h-5" />
                Share to Feed
              </button>
            </div>
            
            <p className="text-xs text-slate-400 mt-2 text-center">You can edit the 'Buy' link and share this item with the community.</p>
        </div>

      </div>
    </div>
  );
};

export default ProductDetailModal;
