import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FlipBookMenu from '@/components/restaurant/FlipBookMenu';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const { totalItems, dispatch } = useCart();

  const { data: restaurant } = useQuery({
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

  useEffect(() => {
    if (restaurant) {
      dispatch({ type: 'SET_RESTAURANT', payload: { id: restaurant.id, slug: restaurant.slug } });
    }
  }, [restaurant, dispatch]);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['menu', restaurant?.id],
    queryFn: async () => {
      const { data: cats } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurant!.id)
        .order('sort_order');

      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant!.id)
        .eq('is_available', true)
        .order('sort_order');

      return (cats || []).map(cat => ({
        ...cat,
        items: (items || []).filter(item => item.category_id === cat.id),
      }));
    },
    enabled: !!restaurant?.id,
  });

  if (isLoading || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <FlipBookMenu
        categories={categories || []}
        restaurantName={restaurant.name}
      />
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
          <Button variant="hero" size="lg" className="w-full rounded-xl py-5 shadow-warm-lg" asChild>
            <Link to={`/r/${slug}/cart`}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              View Cart
              <Badge className="ml-2 bg-primary-foreground text-primary">{totalItems}</Badge>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
