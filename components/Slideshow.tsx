import React, { useState, useEffect, useRef } from 'react';
import { RedesignedRoom } from '../types';
import { PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon, XCircleIcon } from './Icons';

interface SlideshowProps {
  rooms: RedesignedRoom[];
  onClose: () => void;
}

const Slideshow: React.FC<SlideshowProps> = ({ rooms, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<number | null>(null);

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
  
  const handleTogglePlay = () => {
      if(isPlaying) {
          audioRef.current?.pause();
      } else {
          audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
  }

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
      timerRef.current = window.setTimeout(() => {
        goToNext();
      }, 7000); // Change slide every 7 seconds
    } else {
       if (timerRef.current) {
         clearTimeout(timerRef.current);
       }
    }
    return () => {
      if(timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPlaying, rooms.length]);

  if (rooms.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes kenburns-top {
          0% { transform: scale(1) translateY(0); transform-origin: 50% 16%; }
          100% { transform: scale(1.15) translateY(-10px); transform-origin: top; }
        }
        .animate-kenburns {
          animation: kenburns-top 7s ease-out both;
        }
      `}</style>
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center" role="dialog" aria-modal="true">
        <audio ref={audioRef} src="https://cdn.pixabay.com/audio/2023/10/19/audio_139988e57b.mp3" loop />

        {/* Main Image */}
        <div className="relative w-full h-full flex items-center justify-center p-16">
           <div className="w-full h-full max-w-7xl max-h-full overflow-hidden">
                <img
                    key={currentIndex}
                    src={rooms[currentIndex].imageUrl}
                    alt={rooms[currentIndex].roomName}
                    className="w-full h-full object-contain animate-kenburns"
                />
           </div>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" title="Exit Tour">
            <XCircleIcon className="w-10 h-10" />
        </button>

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md rounded-full p-2 flex items-center justify-center gap-4 text-white">
            <button onClick={goToPrevious} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Previous">
                <ChevronLeftIcon className="w-8 h-8"/>
            </button>
            <button onClick={handleTogglePlay} className="p-2 hover:bg-white/20 rounded-full transition-colors" title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
            </button>
            <button onClick={goToNext} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Next">
                <ChevronRightIcon className="w-8 h-8"/>
            </button>
        </div>
        
        {/* Slide Info */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm">
            {currentIndex + 1} / {rooms.length} - {rooms[currentIndex].roomName}
        </div>
      </div>
    </>
  );
};

export default Slideshow;