import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import heroFood from '@/assets/hero-food.jpg';
import food1 from '@/assets/food-1.jpg';
import food2 from '@/assets/food-2.jpg';
import food3 from '@/assets/food-3.jpg';

interface RestaurantLandingProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    cover_image_url: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    opening_hours: Record<string, string> | null;
  };
}

const fallbackFoods = [
  { image_url: food1, name: 'Grilled Chicken', price: 12000 },
  { image_url: food2, name: 'Fresh Juice', price: 5000 },
  { image_url: food3, name: 'Beef Stew', price: 15000 },
];

export default function RestaurantLanding({ restaurant }: RestaurantLandingProps) {
  const { data: popularItems } = useQuery({
    queryKey: ['popular-items', restaurant.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('id, name, price, image_url')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('sort_order', { ascending: true })
        .limit(3);
      return data ?? [];
    },
  });
  const showcase = (popularItems && popularItems.length > 0)
    ? popularItems.map(i => ({ image_url: i.image_url, name: i.name, price: Number(i.price) }))
    : fallbackFoods;
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src={restaurant.cover_image_url || heroFood}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt=""
                className="w-16 h-16 rounded-xl mb-4 border-2 border-background/20 shadow-warm-lg"
                loading="lazy"
                width={64}
                height={64}
              />
            )}
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-background mb-2">
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p className="text-background/80 text-base md:text-lg max-w-lg font-body">
                {restaurant.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-6 md:px-10 py-8 space-y-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4"
        >
          {restaurant.address && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="font-body">{restaurant.address}</span>
            </div>
          )}
          {restaurant.opening_hours && Object.keys(restaurant.opening_hours).length > 0 && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="font-body">Open Now</span>
            </div>
          )}
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="font-body">{restaurant.phone}</span>
            </a>
          )}
          {restaurant.whatsapp && (
            <a href={`https://wa.me/${restaurant.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors">
              <MessageCircle className="w-5 h-5 text-accent flex-shrink-0" />
              <span className="font-body">Chat on WhatsApp</span>
            </a>
          )}
        </motion.div>

        {/* Food Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-heading font-semibold mb-4">Popular Dishes</h2>
          <div className="grid grid-cols-3 gap-3">
            {showcase.map((food, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="rounded-xl overflow-hidden shadow-warm group cursor-pointer bg-muted"
              >
                <div className="relative aspect-square overflow-hidden">
                  {food.image_url ? (
                    <img
                      src={food.image_url}
                      alt={food.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      width={640}
                      height={640}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl">🍽️</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-background text-xs font-semibold font-body truncate">{food.name}</p>
                    <p className="text-background/80 text-[10px] font-body">TZS {food.price.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-3 pt-4"
        >
          <Button variant="hero" size="lg" className="w-full text-lg py-6 rounded-xl" asChild>
            <Link to={`/r/${restaurant.slug}/menu`}>
              Open Menu <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
          <Button variant="outline-warm" size="lg" className="w-full text-lg py-6 rounded-xl" asChild>
            <Link to={`/r/${restaurant.slug}/menu`}>
              Order Now
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
