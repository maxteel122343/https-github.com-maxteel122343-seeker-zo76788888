import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

type UserPlan = 'Free' | 'Basic' | 'Pro' | 'VIP';

export const useUserCredits = () => {
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState<UserPlan>('Free');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchCredits();
      } else {
        setUserId(null);
        setCredits(0);
        setPlan('Free');
      }
    });

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user_credits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
        },
        (payload) => {
          console.log('Credits updated:', payload);
          fetchCredits();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_credits')
        .select('credits, plan')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setCredits(data.credits);
        setPlan(data.plan as UserPlan);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deductCredits = async (amount: number) => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .update({ credits: Math.max(0, credits - amount) })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error deducting credits:', error);
        return false;
      }

      if (data) {
        setCredits(data.credits);
        return true;
      }
    } catch (error) {
      console.error('Error:', error);
      return false;
    }

    return false;
  };

  return { credits, plan, loading, userId, fetchCredits, deductCredits };
};
