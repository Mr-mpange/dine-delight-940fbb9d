import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ShoppingCart, BookOpen } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
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
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'forward' | 'back' | null>(null);
  const [flipAngle, setFlipAngle] = useState(0); // 0 to 180
  const [isAnimating, setIsAnimating] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const { dispatch, totalItems } = useCart();

  // Build pages (3 items per page)
  const allPages: { category: string; items: MenuItem[] }[] = [];
  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    for (let i = 0; i < items.length; i += 3) {
      allPages.push({ category: cat.name, items: items.slice(i, i + 3) });
    }
  });

  // Spreads: cover + pairs
  const spreads: { left: typeof allPages[0] | null; right: typeof allPages[0] | null }[] = [];
  spreads.push({ left: null, right: allPages[0] || null }); // Cover spread
  for (let i = 1; i < allPages.length; i += 2) {
    spreads.push({ left: allPages[i] || null, right: allPages[i + 1] || null });
  }

  const canGoNext = currentSpread < spreads.length - 1;
  const canGoPrev = currentSpread > 0;

  const handlePointerDown = useCallback((e: React.PointerEvent, side: 'left' | 'right') => {
    if (isAnimating) return;
    if (side === 'right' && !canGoNext) return;
    if (side === 'left' && !canGoPrev) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragDirection(side === 'right' ? 'forward' : 'back');
    dragStartX.current = e.clientX;
    setFlipAngle(0);
  }, [isAnimating, canGoNext, canGoPrev]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !bookRef.current) return;
    e.preventDefault();

    const bookWidth = bookRef.current.offsetWidth / 2;
    const deltaX = e.clientX - dragStartX.current;
    let progress: number;

    if (dragDirection === 'forward') {
      progress = Math.max(0, Math.min(1, -deltaX / bookWidth));
    } else {
      progress = Math.max(0, Math.min(1, deltaX / bookWidth));
    }

    setFlipAngle(progress * 180);
  }, [isDragging, dragDirection]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const shouldComplete = flipAngle > 70;
    setIsAnimating(true);

    if (shouldComplete) {
      // Animate to 180
      animateTo(flipAngle, 180, () => {
        if (dragDirection === 'forward') {
          setCurrentSpread(p => p + 1);
        } else {
          setCurrentSpread(p => p - 1);
        }
        setFlipAngle(0);
        setDragDirection(null);
        setIsAnimating(false);
      });
    } else {
      // Animate back to 0
      animateTo(flipAngle, 0, () => {
        setFlipAngle(0);
        setDragDirection(null);
        setIsAnimating(false);
      });
    }
  }, [isDragging, flipAngle, dragDirection]);

  const animateTo = (from: number, to: number, onDone: () => void) => {
    const duration = 350;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setFlipAngle(from + (to - from) * ease);
      if (t < 1) requestAnimationFrame(tick);
      else onDone();
    };
    requestAnimationFrame(tick);
  };

  // Tap to flip (quick tap without much drag)
  const handleTap = useCallback((side: 'left' | 'right') => {
    if (isAnimating) return;
    const dir = side === 'right' ? 'forward' : 'back';
    if (dir === 'forward' && !canGoNext) return;
    if (dir === 'back' && !canGoPrev) return;

    setDragDirection(dir);
    setIsAnimating(true);
    animateTo(0, 180, () => {
      if (dir === 'forward') setCurrentSpread(p => p + 1);
      else setCurrentSpread(p => p - 1);
      setFlipAngle(0);
      setDragDirection(null);
      setIsAnimating(false);
    });
  }, [isAnimating, canGoNext, canGoPrev]);

  const addToCart = (item: MenuItem) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.image_url ?? undefined },
    });
  };

  const jumpToCategory = (catName: string) => {
    const idx = spreads.findIndex(s => s.left?.category === catName || s.right?.category === catName);
    if (idx >= 0 && idx !== currentSpread && !isAnimating) {
      setCurrentSpread(idx);
    }
  };

  const spread = spreads[currentSpread];
  const nextSpread = spreads[currentSpread + 1] || null;
  const prevSpread = spreads[currentSpread - 1] || null;
  const activeCategory = spread?.left?.category || spread?.right?.category;

  // Compute dynamic shadow for flipping page
  const shadowOpacity = Math.sin((flipAngle / 180) * Math.PI) * 0.4;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(170deg, #f5ebe0 0%, #d5c4a1 50%, #e6d5c3 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-30" style={{ background: 'rgba(245,235,224,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-bold text-foreground">{restaurantName}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-body bg-card/60 px-2 py-1 rounded-full border border-border/30">
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
      <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => jumpToCategory(cat.name)}
            className={`px-4 py-1.5 rounded-full text-sm font-body whitespace-nowrap transition-all duration-300 ${
              activeCategory === cat.name
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-card/70 text-muted-foreground hover:bg-card border border-border/40'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* THE BOOK */}
      <div className="flex-1 flex items-center justify-center px-2 py-4" style={{ perspective: '1800px' }}>
        <div className="book-container" ref={bookRef}>
          <div
            className="book-spread"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* LEFT PAGE (static, current) */}
            <div className="book-page book-page-left">
              <div className="page-texture" />
              {currentSpread === 0 ? (
                <CoverContent restaurantName={restaurantName} />
              ) : spread.left ? (
                <BookPage page={spread.left} onAdd={addToCart} side="left" />
              ) : (
                <EmptyPage />
              )}
            </div>

            {/* RIGHT PAGE (static, current) */}
            <div className="book-page book-page-right">
              <div className="page-texture" />
              {spread.right ? (
                <BookPage page={spread.right} onAdd={addToCart} side="right" />
              ) : (
                <EmptyPage isEnd />
              )}
            </div>

            {/* SPINE */}
            <div className="book-spine" />

            {/* Grab zones for dragging */}
            {canGoPrev && !isDragging && !isAnimating && (
              <div
                className="book-grab-zone book-grab-zone-left"
                onPointerDown={e => handlePointerDown(e, 'left')}
                onClick={() => !isDragging && handleTap('left')}
              >
                <div className="page-curl-hint page-curl-hint-left" />
              </div>
            )}
            {canGoNext && !isDragging && !isAnimating && (
              <div
                className="book-grab-zone book-grab-zone-right"
                onPointerDown={e => handlePointerDown(e, 'right')}
                onClick={() => !isDragging && handleTap('right')}
              >
                <div className="page-curl-hint page-curl-hint-right" />
              </div>
            )}

            {/* FOLDING PAGE - Forward (right page folds left) */}
            {dragDirection === 'forward' && (flipAngle > 0 || isDragging) && (
              <>
                {/* Front of flipping page (current right page content) */}
                <div
                  className="flip-page flip-page-right"
                  style={{
                    transform: `rotateY(${-flipAngle}deg)`,
                    boxShadow: `-${2 + shadowOpacity * 10}px 0 ${8 + shadowOpacity * 20}px rgba(0,0,0,${0.05 + shadowOpacity * 0.15})`,
                  }}
                >
                  <div className="page-texture" />
                  <div className="flip-page-shadow" style={{
                    background: `linear-gradient(to right, rgba(0,0,0,${shadowOpacity * 0.15}) 0%, transparent 40%)`,
                  }} />
                  {spread.right ? (
                    <BookPage page={spread.right} onAdd={addToCart} side="right" />
                  ) : <EmptyPage />}
                </div>
                {/* Back of flipping page (next spread's left page) */}
                <div
                  className="flip-page flip-page-right-back"
                  style={{
                    transform: `rotateY(${180 - flipAngle}deg)`,
                  }}
                >
                  <div className="page-texture" />
                  {nextSpread?.left ? (
                    <BookPage page={nextSpread.left} onAdd={addToCart} side="left" />
                  ) : <EmptyPage />}
                </div>

                {/* Shadow cast on the left page */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                  background: `rgba(0,0,0,${shadowOpacity * 0.08})`,
                  pointerEvents: 'none', zIndex: 19, borderRadius: '6px 0 0 6px',
                }} />
              </>
            )}

            {/* FOLDING PAGE - Backward (left page folds right) */}
            {dragDirection === 'back' && (flipAngle > 0 || isDragging) && (
              <>
                <div
                  className="flip-page flip-page-left"
                  style={{
                    transform: `rotateY(${flipAngle}deg)`,
                    boxShadow: `${2 + shadowOpacity * 10}px 0 ${8 + shadowOpacity * 20}px rgba(0,0,0,${0.05 + shadowOpacity * 0.15})`,
                  }}
                >
                  <div className="page-texture" />
                  <div className="flip-page-shadow" style={{
                    background: `linear-gradient(to left, rgba(0,0,0,${shadowOpacity * 0.15}) 0%, transparent 40%)`,
                  }} />
                  {currentSpread === 0 ? (
                    <CoverContent restaurantName={restaurantName} />
                  ) : spread.left ? (
                    <BookPage page={spread.left} onAdd={addToCart} side="left" />
                  ) : <EmptyPage />}
                </div>
                <div
                  className="flip-page flip-page-left-back"
                  style={{
                    transform: `rotateY(${-180 + flipAngle}deg)`,
                  }}
                >
                  <div className="page-texture" />
                  {prevSpread?.right ? (
                    <BookPage page={prevSpread.right} onAdd={addToCart} side="right" />
                  ) : <EmptyPage />}
                </div>

                {/* Shadow cast on right page */}
                <div style={{
                  position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
                  background: `rgba(0,0,0,${shadowOpacity * 0.08})`,
                  pointerEvents: 'none', zIndex: 19, borderRadius: '0 6px 6px 0',
                }} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Page indicator dots */}
      <div className="flex items-center justify-center gap-1.5 pb-3">
        {spreads.map((_, i) => (
          <button
            key={i}
            onClick={() => !isAnimating && setCurrentSpread(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentSpread ? 'bg-primary w-6 h-2.5' : 'bg-foreground/15 w-2.5 h-2.5 hover:bg-foreground/25'
            }`}
          />
        ))}
      </div>

      {/* Instruction hint */}
      {currentSpread === 0 && (
        <p className="text-center text-xs text-muted-foreground/50 font-body pb-2 italic">
          Grab the page edge and drag to turn, or tap the corners
        </p>
      )}
    </div>
  );
}

function CoverContent({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center relative">
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary/20 rounded-tl-md" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary/20 rounded-tr-md" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary/20 rounded-bl-md" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary/20 rounded-br-md" />

      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="space-y-3">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-warm mx-auto flex items-center justify-center shadow-lg">
          <BookOpen className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
        </div>
        <h1 className="text-xl md:text-3xl font-heading font-bold" style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {restaurantName}
        </h1>
        <div className="w-12 h-[2px] mx-auto rounded-full bg-primary/30" />
        <p className="text-muted-foreground font-body text-sm italic">Our Menu</p>
        <p className="text-muted-foreground/40 font-body text-[11px] mt-3">← Grab page edge to turn →</p>
      </motion.div>
    </div>
  );
}

function BookPage({ page, onAdd, side }: {
  page: { category: string; items: MenuItem[] };
  onAdd: (item: MenuItem) => void;
  side: 'left' | 'right';
}) {
  return (
    <div className="h-full flex flex-col p-3 md:p-4 relative z-[2]">
      <div className={`mb-2 pb-1.5 border-b border-primary/15 ${side === 'right' ? 'text-right' : ''}`}>
        <h3 className="text-[11px] md:text-xs font-heading font-bold text-primary uppercase tracking-[0.15em]">
          {page.category}
        </h3>
      </div>
      <div className="flex-1 flex flex-col gap-2.5">
        {page.items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="group">
            <div className="flex gap-2">
              {item.image_url && (
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/5">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-heading font-semibold text-[11px] md:text-xs text-foreground leading-tight">{item.name}</h4>
                {item.description && (
                  <p className="text-[9px] md:text-[10px] text-muted-foreground font-body mt-0.5 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-1 gap-1">
                  <span className="font-body font-bold text-[11px] md:text-xs text-primary">TZS {item.price.toLocaleString()}</span>
                  <button onClick={(e) => { e.stopPropagation(); onAdd(item); }} className="flex items-center gap-0.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-2 py-0.5 text-[9px] md:text-[10px] font-semibold transition-all hover:scale-105 shadow-sm">
                    <Plus className="w-2.5 h-2.5" /> Add
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-2 h-[0.5px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          </motion.div>
        ))}
      </div>
      <div className={`mt-1 text-[9px] text-muted-foreground/30 font-body italic ${side === 'right' ? 'text-right' : ''}`}>— {page.category} —</div>
    </div>
  );
}

function EmptyPage({ isEnd = false }: { isEnd?: boolean }) {
  return (
    <div className="h-full flex items-center justify-center p-6 text-center">
      {isEnd ? (
        <div className="space-y-2">
          <p className="text-muted-foreground/50 font-body italic text-xs">Thank you for browsing</p>
          <div className="w-6 h-[1px] bg-primary/15 mx-auto" />
        </div>
      ) : (
        <p className="text-muted-foreground/20 font-body italic text-xs">~</p>
      )}
    </div>
  );
}
