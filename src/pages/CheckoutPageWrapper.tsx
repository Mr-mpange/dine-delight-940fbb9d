import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CheckoutPage from '@/components/restaurant/CheckoutPage';
import { Loader2 } from 'lucide-react';

export default function CheckoutPageWrapper() {
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

  if (isLoading || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <CheckoutPage
      restaurantId={restaurant.id}
      restaurantSlug={restaurant.slug}
      commissionRate={Number(restaurant.commission_rate) || 10}
    />
  );
}
