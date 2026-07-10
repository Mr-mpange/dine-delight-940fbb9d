import { motion } from 'framer-motion';
import { MapPin, Phone, MessageCircle, ChevronRight, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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

export default function RestaurantLanding({ restaurant }: RestaurantLandingProps) {
  const publicOrigin = typeof window !== 'undefined' && window.location.hostname.includes('id-preview--')
    ? 'https://bite-book-beacon.lovable.app'
    : (typeof window !== 'undefined' ? window.location.origin : '');
  const menuUrl = `${publicOrigin}/r/${restaurant.slug}/menu`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card rounded-3xl shadow-warm-lg border border-border overflow-hidden"
      >
        {/* Compact hero */}
        <div className="relative h-40 overflow-hidden">
          {restaurant.cover_image_url ? (
            <img
              src={restaurant.cover_image_url}
              alt={restaurant.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-warm" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt=""
                className="w-14 h-14 rounded-xl border-2 border-background/30 shadow-warm object-cover"
              />
            )}
            <h1 className="text-2xl font-heading font-bold text-background drop-shadow">
              {restaurant.name}
            </h1>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Description */}
          {restaurant.description ? (
            <p className="text-sm text-muted-foreground font-body leading-relaxed text-center">
              {restaurant.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground font-body italic text-center">
              Welcome — scan the QR code below to explore our menu.
            </p>
          )}

          {/* QR */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white rounded-2xl border-2 border-primary/30 shadow-warm">
              <QRCodeSVG
                value={menuUrl}
                size={168}
                bgColor="white"
                fgColor="#1a1a1a"
                level="H"
                includeMargin={false}
                imageSettings={restaurant.logo_url ? { src: restaurant.logo_url, height: 34, width: 34, excavate: true } : undefined}
              />
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <QrCode className="w-4 h-4" />
              <span className="text-xs font-body font-semibold uppercase tracking-wide">Scan to view menu</span>
            </div>
          </div>

          {/* Quick info */}
          <div className="space-y-2 text-sm">
            {restaurant.address && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-body truncate">{restaurant.address}</span>
              </div>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-body">{restaurant.phone}</span>
              </a>
            )}
            {restaurant.whatsapp && (
              <a href={`https://wa.me/${restaurant.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
                <MessageCircle className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="font-body">Chat on WhatsApp</span>
              </a>
            )}
          </div>

          <Button variant="hero" size="lg" className="w-full rounded-xl" asChild>
            <Link to={`/r/${restaurant.slug}/menu`}>
              Open Menu <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
