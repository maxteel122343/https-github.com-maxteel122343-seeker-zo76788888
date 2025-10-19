import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './use-toast';

interface CustomProductLink {
  room_id: string;
  product_name: string;
  custom_url: string;
}

export const useCustomProductLinks = (userId: string | undefined) => {
  const [customLinks, setCustomLinks] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchCustomLinks();
    }
  }, [userId]);

  const fetchCustomLinks = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('custom_product_links')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const linksMap = new Map<string, string>();
      (data || []).forEach((link: CustomProductLink) => {
        const key = `${link.room_id}_${link.product_name}`;
        linksMap.set(key, link.custom_url);
      });

      setCustomLinks(linksMap);
    } catch (error) {
      console.error('Error fetching custom links:', error);
    }
  };

  const saveCustomLink = async (roomId: string, productName: string, customUrl: string) => {
    if (!userId) {
      toast({
        title: 'Login Required',
        description: 'Please login to save custom links',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('custom_product_links')
        .upsert({
          user_id: userId,
          room_id: roomId,
          product_name: productName,
          custom_url: customUrl
        }, {
          onConflict: 'user_id,room_id,product_name'
        });

      if (error) throw error;

      const key = `${roomId}_${productName}`;
      setCustomLinks(prev => new Map(prev).set(key, customUrl));

      toast({
        title: 'Link Saved',
        description: 'Custom purchase link has been saved'
      });
      
      return true;
    } catch (error) {
      console.error('Error saving custom link:', error);
      toast({
        title: 'Error',
        description: 'Failed to save custom link',
        variant: 'destructive'
      });
      return false;
    }
  };

  const getCustomLink = (roomId: string, productName: string): string | undefined => {
    const key = `${roomId}_${productName}`;
    return customLinks.get(key);
  };

  return { saveCustomLink, getCustomLink, refetch: fetchCustomLinks };
};
