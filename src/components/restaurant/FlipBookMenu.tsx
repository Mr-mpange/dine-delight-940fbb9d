import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const { dispatch, totalItems } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  // Build pages: cover + category pages (2 items per page)
  const pages: { type: 'cover' | 'items'; category?: string; items?: MenuItem[] }[] = [
    { type: 'cover' },
  ];

  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    for (let i = 0; i < items.length; i += 2) {
      pages.push({
        type: 'items',
        category: cat.name,
        items: items.slice(i, i + 2),
      });
    }
  });

  const goNext = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setDirection(1);
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, pages.length]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

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

  const variants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 90 : -90,
      opacity: 0,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -90 : 90,
      opacity: 0,
    }),
  };

  const page = pages[currentPage];

  return (
    <div className="min-h-screen bg-gradient-cream flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <h2 className="text-lg font-heading font-semibold truncate">{restaurantName}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-body">
            {currentPage + 1} / {pages.length}
          </span>
          {totalItems > 0 && (
            <Badge className="bg-primary text-primary-foreground">{totalItems}</Badge>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {categories.map((cat, i) => {
          const pageIndex = pages.findIndex(p => p.category === cat.name);
          return (
            <button
              key={cat.id}
              onClick={() => { setDirection(pageIndex > currentPage ? 1 : -1); setCurrentPage(pageIndex); }}
              className={`px-4 py-1.5 rounded-full text-sm font-body whitespace-nowrap transition-all ${
                page?.category === cat.name
                  ? 'bg-primary text-primary-foreground shadow-warm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Book Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6" style={{ perspective: '1200px' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.645, 0.045, 0.355, 1] }}
            className="w-full max-w-md"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {page.type === 'cover' ? (
              <div className="bg-card rounded-2xl shadow-warm-lg p-8 text-center min-h-[400px] flex flex-col items-center justify-center border border-border">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <h1 className="text-3xl font-heading font-bold text-gradient-warm mb-4">
                    {restaurantName}
                  </h1>
                  <div className="w-20 h-1 bg-gradient-warm mx-auto rounded-full mb-4" />
                  <p className="text-muted-foreground font-body">Our Menu</p>
                  <p className="text-sm text-muted-foreground/60 font-body mt-2">
                    Swipe or tap arrows to browse
                  </p>
                </motion.div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl shadow-warm-lg overflow-hidden border border-border min-h-[400px]">
                <div className="px-5 py-3 border-b border-border bg-secondary/30">
                  <h3 className="text-sm font-heading font-semibold text-primary uppercase tracking-wider">
                    {page.category}
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {page.items?.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAdd={() => addToCart(item)} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 bg-card/80 backdrop-blur-sm border-t border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          disabled={currentPage === 0}
          className="rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <div className="flex gap-1">
          {pages.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentPage ? 'bg-primary w-6' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          disabled={currentPage === pages.length - 1}
          className="rounded-full"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 flex gap-4"
    >
      {item.image_url && (
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-warm">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            width={96}
            height={96}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-heading font-semibold text-base">{item.name}</h4>
        {item.description && (
          <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-body font-bold text-primary">
            TZS {item.price.toLocaleString()}
          </span>
          <Button
            variant="hero"
            size="sm"
            className="rounded-full h-8 px-3"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
