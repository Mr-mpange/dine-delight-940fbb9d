import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import RestaurantLanding from '@/components/restaurant/RestaurantLanding';
import { Loader2 } from 'lucide-react';

export default function RestaurantPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold mb-2">Restaurant Not Found</h1>
          <p className="text-muted-foreground font-body">This restaurant doesn't exist or is not active.</p>
        </div>
      </div>
    );
  }

  return (
    <RestaurantLanding
      restaurant={{
        ...restaurant,
        opening_hours: restaurant.opening_hours as Record<string, string> | null,
      }}
    />
  );
}
