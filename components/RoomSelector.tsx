import React from 'react';
import { BedIcon, SofaIcon, KitchenIcon, BathIcon, DoorIcon } from './Icons';

interface RoomSelectorProps {
  rooms: string[];
  activeRooms: string[];
  onSelectRoom: (room: string) => void;
  disabled?: boolean;
}

const getRoomIcon = (roomName: string) => {
    const lowerCaseName = roomName.toLowerCase();
    if (lowerCaseName.includes('bed')) return <BedIcon />;
    if (lowerCaseName.includes('living') || lowerCaseName.includes('lounge') || lowerCaseName.includes('family')) return <SofaIcon />;
    if (lowerCaseName.includes('kitchen') || lowerCaseName.includes('dining')) return <KitchenIcon />;
    if (lowerCaseName.includes('bath') || lowerCaseName.includes('wc')) return <BathIcon />;
    return <DoorIcon />;
};

const RoomSelector: React.FC<RoomSelectorProps> = ({ rooms, activeRooms, onSelectRoom, disabled }) => {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 p-2 bg-slate-100 rounded-xl ${disabled ? 'opacity-50' : ''}`}>
      {rooms.map((room) => {
        const isActive = activeRooms.includes(room);
        return (
            <button
            key={room}
            onClick={() => onSelectRoom(room)}
            disabled={disabled}
            className={`flex flex-col items-center justify-center p-3 rounded-lg w-24 h-24 transition-all duration-200 transform ${
                isActive 
                ? 'bg-indigo-500 text-white shadow-lg scale-110' 
                : 'bg-white text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 hover:scale-105'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
            title={room}
            >
            {getRoomIcon(room)}
            <span className="text-xs font-semibold mt-2 text-center truncate w-full">{room}</span>
            </button>
        )
      })}
    </div>
  );
};

export default RoomSelector;