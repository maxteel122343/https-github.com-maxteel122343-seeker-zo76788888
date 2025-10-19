import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { RedesignedRoom } from '../../types';
import { useToast } from './use-toast';

export const useSharedDesigns = () => {
  const [sharedDesigns, setSharedDesigns] = useState<RedesignedRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSharedDesigns();
    subscribeToChanges();
  }, []);

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('shared_designs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_designs'
        },
        () => {
          fetchSharedDesigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchSharedDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_designs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const roomsData: RedesignedRoom[] = (data || []).map(design => ({
        id: design.id,
        roomName: design.room_name,
        imageUrl: design.image_url,
        likes: design.likes
      }));

      setSharedDesigns(roomsData);
    } catch (error) {
      console.error('Error fetching shared designs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load community feed',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const shareDesign = async (room: RedesignedRoom, userId: string) => {
    if (!userId) {
      toast({
        title: 'Login Required',
        description: 'Please login to share designs',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('shared_designs')
        .insert({
          user_id: userId,
          room_id: room.id,
          room_name: room.roomName,
          image_url: room.imageUrl
        });

      if (error) throw error;

      toast({
        title: 'Design Shared!',
        description: 'Your design is now in the community feed'
      });
      
      fetchSharedDesigns();
    } catch (error) {
      console.error('Error sharing design:', error);
      toast({
        title: 'Error',
        description: 'Failed to share design',
        variant: 'destructive'
      });
    }
  };

  const likeDesign = async (designId: string, userId: string) => {
    if (!userId) {
      toast({
        title: 'Login Required',
        description: 'Please login to like designs',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('room_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('design_id', designId)
        .single();

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('room_likes')
          .delete()
          .eq('user_id', userId)
          .eq('design_id', designId);

        if (deleteError) throw deleteError;

        // Decrement likes manually
        const { data: design } = await supabase
          .from('shared_designs')
          .select('likes')
          .eq('id', designId)
          .single();

        if (design) {
          await supabase
            .from('shared_designs')
            .update({ likes: Math.max(0, design.likes - 1) })
            .eq('id', designId);
        }

        toast({
          title: 'Unliked',
          description: 'Removed your like'
        });
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('room_likes')
          .insert({
            user_id: userId,
            design_id: designId
          });

        if (insertError) throw insertError;

        // Increment likes manually
        const { data: design } = await supabase
          .from('shared_designs')
          .select('likes')
          .eq('id', designId)
          .single();

        if (design) {
          await supabase
            .from('shared_designs')
            .update({ likes: design.likes + 1 })
            .eq('id', designId);
        }

        toast({
          title: 'Liked!',
          description: 'You liked this design'
        });
      }

      fetchSharedDesigns();
    } catch (error) {
      console.error('Error liking design:', error);
      toast({
        title: 'Error',
        description: 'Failed to like design',
        variant: 'destructive'
      });
    }
  };

  return { sharedDesigns, loading, shareDesign, likeDesign, refetch: fetchSharedDesigns };
};
