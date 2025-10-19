import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { RedesignedRoom } from '../../types';
import { useToast } from './use-toast';

export const useFavorites = (userId: string | undefined) => {
  const [favorites, setFavorites] = useState<RedesignedRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  const fetchFavorites = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const roomsData: RedesignedRoom[] = (data || []).map(fav => ({
        id: fav.room_id,
        roomName: fav.room_name,
        imageUrl: fav.image_url,
        isFavorited: true
      }));

      setFavorites(roomsData);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load favorites',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (room: RedesignedRoom) => {
    if (!userId) {
      toast({
        title: 'Login Required',
        description: 'Please login to save favorites',
        variant: 'destructive'
      });
      return;
    }

    try {
      const isFavorited = favorites.some(fav => fav.id === room.id);

      if (isFavorited) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('room_id', room.id);

        if (error) throw error;

        setFavorites(prev => prev.filter(fav => fav.id !== room.id));
        toast({
          title: 'Removed from favorites',
          description: 'Design removed from your favorites'
        });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: userId,
            room_id: room.id,
            room_name: room.roomName,
            image_url: room.imageUrl
          });

        if (error) throw error;

        setFavorites(prev => [...prev, { ...room, isFavorited: true }]);
        toast({
          title: 'Added to favorites',
          description: 'Design saved to your favorites'
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorites',
        variant: 'destructive'
      });
    }
  };

  const isFavorited = (roomId: string) => {
    return favorites.some(fav => fav.id === roomId);
  };

  return { favorites, loading, toggleFavorite, isFavorited, refetch: fetchFavorites };
};
