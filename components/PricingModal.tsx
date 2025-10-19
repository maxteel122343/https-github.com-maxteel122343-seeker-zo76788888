import React, { useState } from 'react';
import { CloseIcon } from './Icons';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

type UserPlan = 'Free' | 'Basic' | 'Pro' | 'VIP';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: UserPlan;
    userId: string | null;
}

const creditPacks = [
  { id: 'prod_SyYehlUkfzq9Qn', name: '100 Credits', price: '$1', credits: 100 },
  { id: 'prod_SyYasByos1peGR', name: '200 Credits', price: '$2', credits: 200 },
  { id: 'prod_SyYeStqRDuWGFF', name: '500 Credits', price: '$5', credits: 500 },
  { id: 'prod_SyYfzJ1fjz9zb9', name: '1000 Credits', price: '$10', credits: 1000 },
  { id: 'prod_SyYg54VfiOr7LQ', name: '5000 Credits', price: '$50', credits: 5000 },
  { id: 'prod_SyYhva8A2beAw6', name: '10000 Credits', price: '$100', credits: 10000 },
  { id: 'prod_SyYmVrUetdiIBY', name: '2500 Credits', price: '$25', credits: 2500 }, // Note: This was out of order in the prompt
];

const subscriptionPlans = [
    { id: 'prod_SyYChoQJbIb1ye', planName: 'Free' as UserPlan, price: '$0', credits: '20/month', features: ['Basic floor plans', 'Limited styles', 'Email support'] },
    { id: 'prod_SyYK31lYwaraZW', planName: 'Basic' as UserPlan, price: '$9/month', credits: '100/month', features: ['All free features', 'Expanded style library', 'Priority support'] },
    { id: 'prod_SyYMs3lMIhORSP', planName: 'Pro' as UserPlan, price: '$15/month', credits: '500/month', features: ['All basic features', 'Continuous generation', 'Access to new features early'] },
    { id: 'prod_SyYOUxRB7COSzb', planName: 'VIP' as UserPlan, price: '$25/month', credits: '1500/month', features: ['All pro features', 'Highest priority support', '1-on-1 onboarding session'] },
];

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, currentPlan, userId }) => {
    const [activeTab, setActiveTab] = useState<'plans' | 'credits'>('plans');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handlePurchase = async (priceId: string, credits: number, plan?: UserPlan, isSubscription = false) => {
        if (!userId) {
            toast({
                title: 'Authentication Required',
                description: 'Please log in to make a purchase.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    priceId,
                    userId,
                    credits,
                    plan,
                    isSubscription,
                },
            });

            if (error) throw error;

            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            toast({
                title: 'Error',
                description: 'Failed to create checkout session. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white/80 backdrop-blur-lg px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                         <h2 className="text-2xl font-bold text-slate-800">Plans & Pricing</h2>
                         <p className="text-sm text-slate-500">Choose a plan or purchase credits to continue creating.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 flex justify-center border-b border-slate-200">
                        <button onClick={() => setActiveTab('plans')} className={`px-6 py-2 font-semibold ${activeTab === 'plans' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Subscription Plans</button>
                        <button onClick={() => setActiveTab('credits')} className={`px-6 py-2 font-semibold ${activeTab === 'credits' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>One-time Purchase</button>
                    </div>

                    {!userId && (
                        <div className="mb-6 bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-lg" role="alert">
                          <p className="font-bold">Authentication Required</p>
                          <p className="text-sm">Please log in to purchase credits or subscribe to a plan.</p>
                        </div>
                    )}


                    {activeTab === 'plans' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {subscriptionPlans.map(plan => (
                                <div key={plan.id} className={`p-6 rounded-lg border-2 flex flex-col ${currentPlan === plan.planName ? 'border-indigo-500' : 'border-slate-200'}`}>
                                    <h3 className="text-xl font-bold text-slate-800">{plan.planName}</h3>
                                    <p className="text-3xl font-extrabold my-4">{plan.price.split('/')[0]}<span className="text-base font-medium text-slate-500">/month</span></p>
                                    <p className="font-semibold text-indigo-600 mb-4">{plan.credits} credits</p>
                                    <ul className="space-y-2 text-sm text-slate-600 mb-6">
                                        {plan.features.map(feature => <li key={feature} className="flex items-center gap-2">✓ {feature}</li>)}
                                    </ul>
                                    <div className="flex-grow"/>
                                    <button 
                                        onClick={() => handlePurchase(plan.id, 0, plan.planName, true)} 
                                        disabled={currentPlan === plan.planName || loading || !userId}
                                        className="w-full mt-auto bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? 'Processing...' : currentPlan === plan.planName ? 'Current Plan' : 'Subscribe'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'credits' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {creditPacks.sort((a, b) => a.credits - b.credits).map(pack => (
                                <div key={pack.id} className="p-6 rounded-lg border border-slate-200 text-center flex flex-col justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-indigo-600">{pack.credits.toLocaleString()}</p>
                                        <p className="text-slate-500 mb-4">Credits</p>
                                    </div>
                                    <button 
                                        onClick={() => handlePurchase(pack.id, pack.credits, undefined, false)}
                                        disabled={loading || !userId}
                                        className="w-full mt-4 bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? 'Processing...' : `Buy for ${pack.price}`}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
