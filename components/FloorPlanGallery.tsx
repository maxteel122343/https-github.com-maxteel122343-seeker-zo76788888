import React from 'react';

interface FloorPlanGalleryProps {
  plans: string[];
  selectedPlan: string | null;
  onSelectPlan: (planUrl: string) => void;
  isLoading: boolean;
  isContinuouslyGenerating?: boolean;
}

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-slate-500 py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-3 text-sm">{message}</p>
    </div>
);

const FloorPlanGallery: React.FC<FloorPlanGalleryProps> = ({ plans, selectedPlan, onSelectPlan, isLoading, isContinuouslyGenerating }) => {
    if (isLoading) {
        return <LoadingSpinner message="Generating architectural plan..." />;
    }

    if (plans.length === 0 && !isContinuouslyGenerating) {
        return (
             <div className="text-center text-slate-400 py-8 border-2 border-dashed border-slate-200 rounded-lg">
                <p>Your generated floor plans will appear here.</p>
             </div>
        )
    }

    return (
    <div className="space-y-3">
        <h3 className="font-semibold text-slate-700">Select a Floor Plan:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {plans.map((planUrl, index) => (
            <div
            key={index}
            onClick={() => onSelectPlan(planUrl)}
            className={`rounded-lg overflow-hidden cursor-pointer aspect-square transition-all duration-300 transform hover:scale-105 ${
                selectedPlan === planUrl ? 'ring-4 ring-indigo-500 scale-105' : 'ring-2 ring-transparent hover:ring-indigo-300'
            }`}
            >
            <img src={planUrl} alt={`Floor Plan ${index + 1}`} className="w-full h-full object-cover bg-white" />
            </div>
        ))}
        {isContinuouslyGenerating && (
             <div className="flex items-center justify-center rounded-lg bg-slate-100 aspect-square">
                <LoadingSpinner message="Generating..."/>
             </div>
        )}
        </div>
    </div>
    );
};

export default FloorPlanGallery;