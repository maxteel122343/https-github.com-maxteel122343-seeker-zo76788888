import React from 'react';

interface UserCreditsProps {
  creditCount: number;
  plan: 'Free' | 'Basic' | 'Pro' | 'VIP';
}

const planColors: Record<UserCreditsProps['plan'], string> = {
    Free: 'bg-slate-200 text-slate-600',
    Basic: 'bg-sky-200 text-sky-800',
    Pro: 'bg-purple-200 text-purple-800',
    VIP: 'bg-amber-200 text-amber-800',
}

const UserCredits: React.FC<UserCreditsProps> = ({ creditCount, plan }) => {
  return (
    <div className="flex items-center space-x-3">
         <div className="flex items-center space-x-2 bg-slate-100 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700">
            <span>Credits:</span>
            <span className="font-bold text-indigo-600">{creditCount}</span>
        </div>
        <div className={`px-3 py-1.5 text-xs font-bold rounded-full ${planColors[plan]}`}>
            {plan} Plan
        </div>
    </div>
  );
};

export default UserCredits;