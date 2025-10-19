import React, { useState } from 'react';
import { PhotoIcon, HeartIcon, RefreshIcon, ThumbsUpIcon, HeartFilledIcon, PartyPopperIcon, LightBulbIcon } from './Icons';
import { RedesignedRoom, Product } from '../types';
import ProductGallery from './ProductGallery';
import ColorPalette from './ColorPalette';

interface RoomCardProps {
  room: RedesignedRoom;
  onProductSelect: (product: Product) => void;
  onToggleFavorite?: () => void;
  onRegenerate?: () => void;
  onFindProducts?: (room: RedesignedRoom) => void;
  onGeneratePalette?: (room: RedesignedRoom) => void;
  onGenerateHouse?: (room: RedesignedRoom) => Promise<void>;
  onLike?: (room: RedesignedRoom) => void;
  onReact?: (room: RedesignedRoom, emoji: string) => void;
  isFeedView?: boolean;
}

const ProductLoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-600 rounded-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-3 text-sm font-semibold">Finding products...</p>
    </div>
);
const PaletteLoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-600 rounded-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        <p className="mt-3 text-sm font-semibold">Generating palette...</p>
    </div>
);


const ImageActions: React.FC<{ room: RedesignedRoom; onToggleFavorite?: () => void; onRegenerate?: () => void; }> = ({ room, onToggleFavorite, onRegenerate }) => {
    return (
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {onToggleFavorite && (
                <button
                    onClick={onToggleFavorite}
                    className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-pink-500 hover:bg-white hover:scale-110 transition-all"
                    title={room.isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                    <HeartIcon filled={room.isFavorited} className="w-6 h-6" />
                </button>
            )}
            {onRegenerate && (
                <button
                    onClick={onRegenerate}
                    className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-700 hover:bg-white hover:scale-110 transition-all"
                    title="Try Again (2 Credits)"
                >
                    <RefreshIcon className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}

const ReactionButton: React.FC<{ onReact: () => void, children: React.ReactNode, count: number }> = ({onReact, children, count}) => (
    <button onClick={onReact} className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors">
        {children}
        <span className="text-xs font-semibold">{count}</span>
    </button>
);

const RoomCard: React.FC<RoomCardProps> = ({ room, onProductSelect, onToggleFavorite, onRegenerate, onFindProducts, onGeneratePalette, onGenerateHouse, onLike, onReact, isFeedView }) => {
  const [isGeneratingHouse, setIsGeneratingHouse] = useState(false);

  const handleGenerateHouseClick = async () => {
    if (!onGenerateHouse) return;
    setIsGeneratingHouse(true);
    try {
        await onGenerateHouse(room);
    } catch (error) {
        console.error("Failed to generate house from card:", error);
    } finally {
        setIsGeneratingHouse(false);
    }
  };

  return (
    <div className="space-y-3">
        {isFeedView && <h3 className="font-semibold text-center text-slate-700">{room.roomName}</h3>}
        <div className="group relative w-full bg-slate-100 rounded-xl flex items-center justify-center p-2 aspect-square">
            <img src={room.imageUrl} alt={`Redesigned ${room.roomName}`} className="w-full h-full object-contain rounded-lg" />
            {room.isLoadingProducts && <ProductLoadingSpinner />}
            {room.isLoadingPalette && <PaletteLoadingSpinner />}
            <ImageActions room={room} onToggleFavorite={onToggleFavorite} onRegenerate={onRegenerate} />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
            {(!room.products || room.products.length === 0) && !room.isLoadingProducts && onFindProducts && (
                <button 
                    onClick={() => onFindProducts(room)}
                    className="flex-1 text-center py-2 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors text-sm"
                >
                    Find Products (1 Credit)
                </button>
            )}
             {(!room.colorPalette) && !room.isLoadingPalette && onGeneratePalette && (
                <button 
                    onClick={() => onGeneratePalette(room)}
                    className="flex-1 text-center py-2 bg-teal-100 text-teal-700 font-semibold rounded-lg hover:bg-teal-200 transition-colors text-sm"
                >
                    Generate Palette (1 Credit)
                </button>
            )}
        </div>
        
        {onGenerateHouse && (
             <button 
                onClick={handleGenerateHouseClick}
                disabled={isGeneratingHouse}
                className="w-full text-center py-2.5 bg-orange-100 text-orange-700 font-semibold rounded-lg hover:bg-orange-200 transition-colors text-sm disabled:bg-slate-200 disabled:text-slate-500"
            >
                {isGeneratingHouse ? 'Generating Exterior...' : 'Generate House (2 Credits)'}
            </button>
        )}

        {room.products && room.products.length > 0 && (
            <ProductGallery products={room.products} onSelect={onProductSelect} />
        )}

        {room.colorPalette && (
            <ColorPalette colors={room.colorPalette} />
        )}

        {isFeedView && onLike && onReact && (
            <div className="flex items-center justify-between p-2 border-t border-slate-200 mt-2">
                <ReactionButton onReact={() => onLike(room)} count={room.likes || 0}>
                    <ThumbsUpIcon className="w-5 h-5"/>
                </ReactionButton>
                 <div className="flex items-center gap-3">
                    <ReactionButton onReact={() => onReact(room, '❤️')} count={room.reactions?.['❤️'] || 0}>
                        <HeartFilledIcon className="w-5 h-5 text-red-500"/>
                    </ReactionButton>
                    <ReactionButton onReact={() => onReact(room, '🎉')} count={room.reactions?.['🎉'] || 0}>
                        <PartyPopperIcon className="w-5 h-5 text-yellow-500"/>
                    </ReactionButton>
                    <ReactionButton onReact={() => onReact(room, '🤔')} count={room.reactions?.['🤔'] || 0}>
                        <LightBulbIcon className="w-5 h-5 text-blue-500"/>
                    </ReactionButton>
                 </div>
            </div>
        )}
    </div>
  );
};

export default RoomCard;