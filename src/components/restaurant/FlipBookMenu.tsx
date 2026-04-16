import { useRef, useEffect, useCallback } from 'react';
import { PageFlip } from 'page-flip';
import { Plus, ShoppingCart, BookOpen } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import '@/styles/flipbook.css';

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
  const bookRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const { dispatch, totalItems } = useCart();

  const allPages: { category: string; items: MenuItem[] }[] = [];
  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    for (let i = 0; i < items.length; i += 3) {
      allPages.push({ category: cat.name, items: items.slice(i, i + 3) });
    }
  });

  const addToCart = useCallback((item: MenuItem) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.image_url ?? undefined },
    });
  }, [dispatch]);

  useEffect(() => {
    if (!bookRef.current) return;
    const pf = new PageFlip(bookRef.current, {
      width: 350,
      height: 500,
      size: 'stretch',
      minWidth: 140,
      maxWidth: 400,
      minHeight: 200,
      maxHeight: 600,
      drawShadow: true,
      maxShadowOpacity: 0.5,
      flippingTime: 900,
      swipeDistance: 30,
      showCover: true,
      usePortrait: true,
      mobileScrollSupport: false,
    });
    pf.loadFromHTML(bookRef.current.querySelectorAll<HTMLElement>('.pf-page'));
    pageFlipRef.current = pf;
    return () => { pf.destroy(); pageFlipRef.current = null; };
  }, []);

  const goNext = () => pageFlipRef.current?.flipNext();
  const goPrev = () => pageFlipRef.current?.flipPrev();

  const jumpToCategory = (catName: string) => {
    if (!pageFlipRef.current) return;
    const pageIdx = allPages.findIndex(p => p.category === catName);
    if (pageIdx >= 0) pageFlipRef.current.flip(pageIdx + 1);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(170deg, #f5ebe0 0%, #d5c4a1 50%, #e6d5c3 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-30"
        style={{ background: 'rgba(245,235,224,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-bold text-foreground">{restaurantName}</h2>
        </div>
        {totalItems > 0 && (
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
              {totalItems}
            </span>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => jumpToCategory(cat.name)}
            className="px-4 py-1.5 rounded-full text-sm font-body whitespace-nowrap transition-all duration-300 bg-card/70 text-muted-foreground hover:bg-card border border-border/40">
            {cat.name}
          </button>
        ))}
      </div>

      {/* Book */}
      <div className="flex items-center justify-center px-2 py-6 flex-1">
        <div ref={bookRef} className="pf-book">
          {/* Front Cover */}
          <div className="pf-page pf-cover" data-density="hard">
            <div className="pf-cover-inner">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }} className="space-y-3 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/80 mx-auto flex items-center justify-center shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-heading font-bold text-white drop-shadow">{restaurantName}</h1>
                <div className="w-12 h-[2px] mx-auto rounded-full bg-white/40" />
                <p className="text-white/70 font-body text-sm italic">Our Menu</p>
                <p className="text-white/40 font-body text-[11px] mt-3">Drag corners to turn pages</p>
              </motion.div>
            </div>
          </div>

          {/* Menu Pages */}
          {allPages.map((page, i) => (
            <div key={i} className="pf-page">
              <div className="pf-page-inner">
                <div className="mb-2 pb-1.5 border-b border-primary/15">
                  <h3 className="text-[11px] font-heading font-bold text-primary uppercase tracking-[0.15em]">{page.category}</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {page.items.map(item => (
                    <div key={item.id} className="flex gap-2">
                      {item.image_url && (
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/5">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-semibold text-xs text-foreground leading-tight">{item.name}</h4>
                        {item.description && (
                          <p className="text-[10px] text-muted-foreground font-body mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-1 gap-1">
                          <span className="font-body font-bold text-xs text-primary">TZS {item.price.toLocaleString()}</span>
                          <button onClick={() => addToCart(item)}
                            className="flex items-center gap-0.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all hover:scale-105 shadow-sm">
                            <Plus className="w-2.5 h-2.5" /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-2 text-[9px] text-muted-foreground/30 font-body italic text-right">— {page.category} —</div>
              </div>
            </div>
          ))}

          {/* Back Cover */}
          <div className="pf-page pf-cover" data-density="hard">
            <div className="pf-cover-inner justify-center">
              <p className="text-white/70 font-body italic text-lg">Thank you for visiting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Buttons */}
      <div className="flex items-center justify-center gap-6 pb-6">
        <button onClick={goPrev}
          className="px-6 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-all border border-primary/20">
          ← Prev
        </button>
        <button onClick={goNext}
          className="px-6 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-all border border-primary/20">
          Next →
        </button>
      </div>
    </div>
  );
}
