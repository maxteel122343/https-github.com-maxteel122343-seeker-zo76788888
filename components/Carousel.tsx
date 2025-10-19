import React, { useState, useEffect } from 'react';
import { PhotoIcon } from './Icons';
import { RedesignedRoom, Product } from '../types';
import RoomCard from './RoomCard';

interface CarouselProps {
  rooms: RedesignedRoom[];
  isLoading: boolean;
  onProductSelect: (product: Product, roomId: string) => void;
  onToggleFavorite: (room: RedesignedRoom) => void;
  onRegenerate: () => void;
  onFindProducts: (room: RedesignedRoom) => void;
  onGeneratePalette: (room: RedesignedRoom) => void;
  onGenerateHouse: (room: RedesignedRoom) => Promise<void>;
}

const LoadingSpinner: React.FC<{ status?: string }> = ({ status }) => (
    <div className="flex flex-col items-center justify-center text-slate-600">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-lg font-semibold">{status || 'Working on it...'}</p>
        <p className="mt-2 text-sm text-slate-400">The AI is creating your 3D space!</p>
    </div>
);


const Carousel: React.FC<CarouselProps> = ({ rooms, isLoading, ...props }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // When the number of rooms changes, if the current index is out of bounds,
    // reset it to 0 to prevent a crash.
    if (currentIndex >= rooms.length) {
      setCurrentIndex(0);
    }
  }, [rooms.length, currentIndex]);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? rooms.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === rooms.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };
  
  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center p-4 min-h-[400px] aspect-square">
        <LoadingSpinner />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center p-4 min-h-[400px] aspect-square">
        <div className="text-center text-slate-500">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-200 rounded-lg flex items-center justify-center">
             <PhotoIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold">Your redesigned rooms will appear here</h3>
          <p className="mt-1 text-sm">Generate a floor plan, pick a style, and see the magic.</p>
        </div>
      </div>
    );
  }

  const currentRoom = rooms[currentIndex];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">{currentRoom.roomName}</h2>
      
      <div className="relative">
        <RoomCard 
          room={currentRoom} 
          onProductSelect={(product) => props.onProductSelect(product, currentRoom.id)}
          onToggleFavorite={() => props.onToggleFavorite(currentRoom)}
          onFindProducts={props.onFindProducts}
          onGeneratePalette={props.onGeneratePalette}
          onGenerateHouse={props.onGenerateHouse}
        />

        {rooms.length > 1 && (
            <>
                <button onClick={goToPrevious} className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-4 bg-white/50 hover:bg-white p-2 rounded-full shadow-md z-10">
                    &#10094;
                </button>
                <button onClick={goToNext} className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 bg-white/50 hover:bg-white p-2 rounded-full shadow-md z-10">
                    &#10095;
                </button>
            </>
        )}
      </div>

       <div className="flex justify-center mt-4">
        {rooms.map((_, slideIndex) => (
          <div
            key={slideIndex}
            onClick={() => goToSlide(slideIndex)}
            className={`w-3 h-3 rounded-full mx-1 cursor-pointer ${currentIndex === slideIndex ? 'bg-indigo-600' : 'bg-slate-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;