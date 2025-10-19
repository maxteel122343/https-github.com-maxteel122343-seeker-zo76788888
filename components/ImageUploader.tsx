import React, { useRef } from 'react';
import { ImageFile } from '../types';
import { UploadIcon, TrashIcon } from './Icons';

interface ImageUploaderProps {
  image: ImageFile | null;
  onImageChange: (image: ImageFile | null) => void;
  label: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ image, onImageChange, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageChange({ file, preview: URL.createObjectURL(file) });
    }
  };

  const handleRemoveImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onImageChange(null);
    if (inputRef.current) {
        inputRef.current.value = "";
    }
  };
  
  const handleContainerClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className="relative w-full h-64 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-center p-4 cursor-pointer hover:border-indigo-500 hover:bg-slate-200 transition-all duration-300"
      onClick={handleContainerClick}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      {image ? (
        <>
          <img src={image.preview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-red-500"
            aria-label="Remove image"
          >
            <TrashIcon />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center text-slate-500">
          <UploadIcon className="w-10 h-10 mb-2" />
          <span className="font-semibold">{label}</span>
          <p className="text-xs">PNG, JPG, WEBP</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;