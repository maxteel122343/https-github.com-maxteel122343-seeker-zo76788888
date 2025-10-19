import React from 'react';
import { RedesignedRoom, Product } from '../types';
import RoomCard from './RoomCard';
import { HeartIcon } from './Icons';

interface SavedViewProps {
  savedRooms: RedesignedRoom[];
  onProductSelect: (product: Product, roomId: string) => void;
  onToggleFavorite: (room: RedesignedRoom) => void;
  onFindProducts: (room: RedesignedRoom) => void;
  onGeneratePalette: (room: RedesignedRoom) => void;
  onGenerateHouse: (room: RedesignedRoom) => Promise<void>;
}

const SavedView: React.FC<SavedViewProps> = ({ savedRooms, onProductSelect, onToggleFavorite, onFindProducts, onGeneratePalette, onGenerateHouse }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">My Saved Designs</h2>
        
        {savedRooms.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-lg">
                <HeartIcon className="w-16 h-16 mx-auto text-slate-300" />
                <h3 className="mt-4 text-xl font-semibold text-slate-600">No Saved Images Yet</h3>
                <p className="mt-2 text-slate-400">Click the heart icon on any generated image to save it here.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedRooms.map(room => (
                    <div key={room.id} className="space-y-2">
                        <h3 className="font-semibold text-center text-slate-700">{room.roomName}</h3>
                        <RoomCard
                            room={room}
                            onProductSelect={(product) => onProductSelect(product, room.id)}
                            onToggleFavorite={() => onToggleFavorite(room)}
                            onFindProducts={onFindProducts}
                            onGeneratePalette={onGeneratePalette}
                            onGenerateHouse={onGenerateHouse}
                        />
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default SavedView;