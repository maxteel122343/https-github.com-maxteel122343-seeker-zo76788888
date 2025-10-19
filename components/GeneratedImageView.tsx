import React from 'react';

interface GeneratedImageViewProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-slate-600">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-lg">Creating your sticker...</p>
        <p className="mt-2 text-sm text-slate-400">The AI is working its magic!</p>
    </div>
);

const GeneratedImageView: React.FC<GeneratedImageViewProps> = ({ imageUrl, isLoading, error }) => {
  return (
    <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center p-4 min-h-[400px] aspect-square">
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-center text-red-500">
          <h3 className="text-xl font-bold">Generation Failed</h3>
          <p className="mt-2 text-slate-600">{error}</p>
        </div>
      ) : imageUrl ? (
        <img src={imageUrl} alt="Generated Sticker" className="w-full h-full object-contain" />
      ) : (
        <div className="text-center text-slate-500">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-200 rounded-lg flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold">Your sticker will appear here</h3>
          <p className="mt-1 text-sm">Upload a photo and let the AI create something amazing for you.</p>
        </div>
      )}
    </div>
  );
};

export default GeneratedImageView;