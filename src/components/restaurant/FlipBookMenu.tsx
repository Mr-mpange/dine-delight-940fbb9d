import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, ShoppingCart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface FlipBookMenuProps {
  categories: MenuCategory[];
  restaurantName: string;
}

export default function FlipBookMenu({ categories, restaurantName }: FlipBookMenuProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const { dispatch, totalItems } = useCart();

  // Build all pages as pairs (left + right) like a real book
  const allPages: { category: string; items: MenuItem[] }[] = [];

  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    for (let i = 0; i < items.length; i += 3) {
      allPages.push({
        category: cat.name,
        items: items.slice(i, i + 3),
      });
    }
  });

  // Group into spreads (pairs of pages)
  const spreads: { left: typeof allPages[0] | null; right: typeof allPages[0] | null }[] = [];
  // First spread: cover (left) + first page (right)
  spreads.push({ left: null, right: allPages[0] || null });
  for (let i = 1; i < allPages.length; i += 2) {
    spreads.push({
      left: allPages[i] || null,
      right: allPages[i + 1] || null,
    });
  }

  const goNext = useCallback(() => {
    if (currentSpread < spreads.length - 1 && !isFlipping) {
      setIsFlipping(true);
      setDirection(1);
      setCurrentSpread(p => p + 1);
      setTimeout(() => setIsFlipping(false), 600);
    }
  }, [currentSpread, spreads.length, isFlipping]);

  const goPrev = useCallback(() => {
    if (currentSpread > 0 && !isFlipping) {
      setIsFlipping(true);
      setDirection(-1);
      setCurrentSpread(p => p - 1);
      setTimeout(() => setIsFlipping(false), 600);
    }
  }, [currentSpread, isFlipping]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -60) goNext();
    else if (info.offset.x > 60) goPrev();
  };

  const addToCart = (item: MenuItem) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.image_url ?? undefined,
      },
    });
  };

  const jumpToCategory = (catName: string) => {
    const idx = spreads.findIndex(
      s => s.left?.category === catName || s.right?.category === catName
    );
    if (idx >= 0 && idx !== currentSpread) {
      setDirection(idx > currentSpread ? 1 : -1);
      setCurrentSpread(idx);
    }
  };

  const spread = spreads[currentSpread];
  const activeCategory = spread?.left?.category || spread?.right?.category;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, hsl(30 20% 92%), hsl(25 15% 88%))' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur-md border-b border-border/50 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-bold text-foreground">{restaurantName}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-body px-2 py-1 bg-secondary rounded-full">
            {currentSpread + 1} / {spreads.length}
          </span>
          {totalItems > 0 && (
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-card/40 backdrop-blur-sm">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => jumpToCategory(cat.name)}
            className={`px-4 py-1.5 rounded-full text-sm font-body whitespace-nowrap transition-all duration-300 ${
              activeCategory === cat.name
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                : 'bg-card text-muted-foreground hover:bg-secondary border border-border/50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* THE BOOK */}
      <div className="flex-1 flex items-center justify-center px-3 py-6 overflow-hidden">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className="w-full max-w-4xl cursor-grab active:cursor-grabbing"
          style={{ perspective: '2000px' }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSpread}
              custom={direction}
              initial={(dir: number) => ({
                rotateY: dir > 0 ? -15 : 15,
                opacity: 0,
                scale: 0.92,
              })}
              animate={{
                rotateY: 0,
                opacity: 1,
                scale: 1,
              }}
              exit={(dir: number) => ({
                rotateY: dir > 0 ? 15 : -15,
                opacity: 0,
                scale: 0.92,
              })}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Book Binding */}
              <div className="relative flex rounded-xl overflow-hidden"
                style={{
                  boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05), inset 0 0 80px rgba(0,0,0,0.03)',
                }}
              >
                {/* Spine shadow */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[6px] -translate-x-1/2 z-10"
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,0,0,0.15), rgba(0,0,0,0.03), rgba(0,0,0,0.15))',
                  }}
                />

                {/* Left Page */}
                <div className="w-1/2 min-h-[420px] md:min-h-[500px] relative"
                  style={{
                    background: 'linear-gradient(135deg, hsl(35 30% 97%), hsl(30 20% 94%))',
                    borderRight: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Paper texture overlay */}
                  <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Cpath d=\'M0 0h20v20H0zM20 20h20v20H20z\' fill=\'%23000\' fill-opacity=\'.03\'/%3E%3C/svg%3E")' }}
                  />

                  {currentSpread === 0 ? (
                    /* Cover Page */
                    <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="space-y-4"
                      >
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-warm mx-auto flex items-center justify-center shadow-lg">
                          <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl md:text-4xl font-heading font-bold" style={{
                          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                          {restaurantName}
                        </h1>
                        <div className="w-16 h-[2px] mx-auto rounded-full" style={{
                          background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
                        }} />
                        <p className="text-muted-foreground font-body text-sm md:text-base italic">
                          "Our Menu"
                        </p>
                        <p className="text-muted-foreground/50 font-body text-xs mt-4">
                          ← Swipe to browse →
                        </p>
                      </motion.div>

                      {/* Decorative corner */}
                      <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-primary/20 rounded-tl-lg" />
                      <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-primary/20 rounded-br-lg" />
                    </div>
                  ) : spread.left ? (
                    <BookPage page={spread.left} onAdd={addToCart} side="left" />
                  ) : (
                    <EmptyPage />
                  )}
                </div>

                {/* Right Page */}
                <div className="w-1/2 min-h-[420px] md:min-h-[500px] relative"
                  style={{
                    background: 'linear-gradient(225deg, hsl(35 30% 97%), hsl(30 20% 95%))',
                  }}
                >
                  <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Cpath d=\'M0 0h20v20H0zM20 20h20v20H20z\' fill=\'%23000\' fill-opacity=\'.03\'/%3E%3C/svg%3E")' }}
                  />

                  {spread.right ? (
                    <BookPage page={spread.right} onAdd={addToCart} side="right" />
                  ) : (
                    <EmptyPage isEnd />
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 bg-card/90 backdrop-blur-md border-t border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          disabled={currentSpread === 0}
          className="rounded-full w-10 h-10 hover:bg-primary/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex gap-1.5 items-center">
          {spreads.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentSpread ? 1 : -1);
                setCurrentSpread(i);
              }}
              className={`rounded-full transition-all duration-300 ${
                i === currentSpread
                  ? 'bg-primary w-6 h-2.5'
                  : 'bg-muted-foreground/20 w-2.5 h-2.5 hover:bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          disabled={currentSpread === spreads.length - 1}
          className="rounded-full w-10 h-10 hover:bg-primary/10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

function BookPage({ page, onAdd, side }: {
  page: { category: string; items: MenuItem[] };
  onAdd: (item: MenuItem) => void;
  side: 'left' | 'right';
}) {
  return (
    <div className="h-full flex flex-col relative p-3 md:p-5">
      {/* Category header */}
      <div className={`mb-3 pb-2 border-b border-primary/10 ${side === 'right' ? 'text-right' : ''}`}>
        <h3 className="text-xs md:text-sm font-heading font-bold text-primary uppercase tracking-[0.15em]">
          {page.category}
        </h3>
        <div className={`w-8 h-[1.5px] bg-primary/30 mt-1 rounded-full ${side === 'right' ? 'ml-auto' : ''}`} />
      </div>

      {/* Menu items */}
      <div className="flex-1 flex flex-col gap-3">
        {page.items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group"
          >
            <div className="flex gap-2 md:gap-3">
              {item.image_url && (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md ring-1 ring-black/5">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    width={64}
                    height={64}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-heading font-semibold text-xs md:text-sm text-foreground leading-tight">
                  {item.name}
                </h4>
                {item.description && (
                  <p className="text-[10px] md:text-xs text-muted-foreground font-body mt-0.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1.5 gap-1">
                  <span className="font-body font-bold text-xs md:text-sm text-primary">
                    TZS {item.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => onAdd(item)}
                    className="flex items-center gap-0.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative separator */}
            <div className="mt-2 h-[0.5px] bg-gradient-to-r from-transparent via-border to-transparent" />
          </motion.div>
        ))}
      </div>

      {/* Page number */}
      <div className={`mt-2 text-[10px] text-muted-foreground/40 font-body italic ${side === 'right' ? 'text-right' : ''}`}>
        — {page.category} —
      </div>
    </div>
  );
}

function EmptyPage({ isEnd = false }: { isEnd?: boolean }) {
  return (
    <div className="h-full flex items-center justify-center p-6 text-center">
      {isEnd ? (
        <div className="space-y-3">
          <p className="text-muted-foreground/60 font-body italic text-sm">
            Thank you for browsing our menu
          </p>
          <div className="w-8 h-[1.5px] bg-primary/20 mx-auto rounded-full" />
          <p className="text-muted-foreground/40 font-body text-xs">
            Tap items to add to cart
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground/30 font-body italic text-xs">~</p>
      )}
    </div>
  );
}
