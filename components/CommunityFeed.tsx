import React from 'react';
import { RedesignedRoom, Product } from '../types';
import RoomCard from './RoomCard';
import { ShareIcon } from './Icons';

interface CommunityFeedProps {
  feedItems: RedesignedRoom[];
  onProductSelect: (product: Product, roomId: string) => void;
  onToggleFavorite: (room: RedesignedRoom) => void;
  onFindProducts: (room: RedesignedRoom) => void;
  onGeneratePalette: (room: RedesignedRoom) => void;
  onGenerateHouse: (room: RedesignedRoom) => Promise<void>;
  onLike: (room: RedesignedRoom) => void;
  onReact: (room: RedesignedRoom, emoji: string) => void;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({ feedItems, ...props }) => {
  return (
     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Community Feed</h2>
        
        {feedItems.length === 0 ? (
             <div className="text-center py-20 bg-slate-50 rounded-lg">
                <ShareIcon className="w-16 h-16 mx-auto text-slate-300" />
                <h3 className="mt-4 text-xl font-semibold text-slate-600">The Feed is Empty</h3>
                <p className="mt-2 text-slate-400">Newly generated designs will appear here automatically!</p>
            </div>
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {feedItems.map((item) => (
                    <RoomCard 
                        key={item.id} 
                        room={item} 
                        isFeedView={true}
                        onProductSelect={(product) => props.onProductSelect(product, item.id)}
                        // Fix: The `onToggleFavorite` prop expected by RoomCard takes no arguments,
                        // but the one from `...props` expected a `RedesignedRoom`.
                        // This overrides the spread prop with a correctly-typed callback.
                        onToggleFavorite={() => props.onToggleFavorite(item)}
                        {...props}
                    />
                ))}
            </div>
        )}
    </div>
  );
};

export default CommunityFeed;