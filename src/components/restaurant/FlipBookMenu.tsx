import { useRef, useEffect, useCallback, useState } from 'react';
import { PageFlip } from 'page-flip';
import { Plus, ShoppingCart, BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
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
  coverImageUrl?: string | null;
}

function categoryEmoji(name: string) {
  const n = name.toLowerCase();
  if (n.includes('drink') || n.includes('juice') || n.includes('beverage')) return '🥤';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('burger')) return '🍔';
  if (n.includes('chicken')) return '🍗';
  if (n.includes('fish') || n.includes('seafood')) return '🐟';
  if (n.includes('rice') || n.includes('ugali')) return '🍚';
  if (n.includes('salad')) return '🥗';
  if (n.includes('dessert') || n.includes('sweet')) return '🍰';
  if (n.includes('soup')) return '🍲';
  if (n.includes('breakfast')) return '🍳';
  return '🍽️';
}

export default function FlipBookMenu({ categories, restaurantName, coverImageUrl }: FlipBookMenuProps) {
  const bookRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { dispatch, totalItems } = useCart();
  const { slug } = useParams<{ slug: string }>();

  // 2 items per page for visual breathing room
  const allPages: { category: string; categoryImage?: string; items: MenuItem[] }[] = [];
  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    const categoryImage = items.find(i => i.image_url)?.image_url ?? undefined;
    for (let i = 0; i < items.length; i += 2) {
      allPages.push({ category: cat.name, categoryImage, items: items.slice(i, i + 2) });
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
    const raf = requestAnimationFrame(() => {
      if (!bookRef.current) return;
      const pf = new PageFlip(bookRef.current, {
        width: 320,
        height: 480,
        size: 'stretch',
        minWidth: 120,
        maxWidth: 380,
        minHeight: 180,
        maxHeight: 560,
        drawShadow: true,
        maxShadowOpacity: 0.6,
        flippingTime: 800,
        swipeDistance: 20,
        showCover: true,
        usePortrait: true,
        mobileScrollSupport: false,
        clickEventForward: false,
      });
      pf.loadFromHTML(bookRef.current.querySelectorAll<HTMLElement>('.pf-page'));
      pf.on('flip', (e) => setCurrentPage((e as unknown as { data: number }).data));
      setTotalPages(pf.getPageCount());
      pageFlipRef.current = pf;
    });
    return () => {
      cancelAnimationFrame(raf);
      pageFlipRef.current?.destroy();
      pageFlipRef.current = null;
    };
  }, []);

  const goNext = () => pageFlipRef.current?.flipNext();
  const goPrev = () => pageFlipRef.current?.flipPrev();

  const jumpToCategory = (catName: string) => {
    if (!pageFlipRef.current) return;
    const idx = allPages.findIndex(p => p.category === catName);
    if (idx >= 0) pageFlipRef.current.flip(idx + 1);
  };

  const activeCategory = allPages[Math.max(0, currentPage - 1)]?.category;

  return (
    <motion.div
      className="book-overlay"
      initial={{ opacity: 0, scale: 0.9, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="book-header">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="text-white font-semibold text-sm truncate max-w-[160px]">{restaurantName}</span>
        </div>
        <div className="flex items-center gap-3">
          {totalItems > 0 && (
            <Link to={`/r/${slug}/cart`} className="relative">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <Badge className="absolute -top-2 -right-2 w-4 h-4 p-0 flex items-center justify-center text-[9px] bg-amber-500 text-black border-0">
                {totalItems}
              </Badge>
            </Link>
          )}
          <Link to={`/r/${slug}`} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="book-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => jumpToCategory(cat.name)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat.name
                ? 'bg-amber-500 text-black shadow-lg'
                : 'text-white/50 hover:text-white/80 border border-white/10'
            }`}
            style={{ background: activeCategory === cat.name ? undefined : 'rgba(255,255,255,0.06)' }}
          >
            {categoryEmoji(cat.name)} {cat.name}
          </button>
        ))}
      </div>

      {/* Book Stage */}
      <div className="book-stage">
        <div ref={bookRef} className="pf-book">

          {/* Front Cover */}
          <div className="pf-page pf-cover" data-density="hard">
            {coverImageUrl && <img src={coverImageUrl} alt="" className="pf-cover-image" />}
            <div className="pf-cover-inner">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.55, type: 'spring', damping: 14 }}
                className="text-center space-y-3"
              >
                <div className="w-16 h-16 rounded-full border-2 border-amber-400/40 mx-auto flex items-center justify-center"
                  style={{ background: 'rgba(251,191,36,0.15)', backdropFilter: 'blur(8px)' }}>
                  <BookOpen className="w-8 h-8 text-amber-300" />
                </div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg leading-tight">{restaurantName}</h1>
                <div className="w-10 h-px mx-auto bg-amber-400/40" />
                <p className="text-amber-200/60 text-xs italic">Our Menu</p>
                <p className="text-white/25 text-[10px] mt-4">Drag corners · Tap edges · Swipe</p>
              </motion.div>
            </div>
          </div>

          {/* Menu Pages */}
          {allPages.map((page, i) => (
            <div key={i} className="pf-page">
              <div className="pf-page-inner">
                {/* Hero */}
                {page.categoryImage ? (
                  <img src={page.categoryImage} alt={page.category} className="pf-page-hero" />
                ) : (
                  <div className="pf-page-hero-placeholder">{categoryEmoji(page.category)}</div>
                )}

                {/* Category pill overlaid on hero */}
                <div style={{ marginTop: -14, paddingLeft: 10, position: 'relative', zIndex: 2, marginBottom: 6 }}>
                  <span style={{
                    background: 'linear-gradient(90deg,#8b4513,#c0622a)',
                    color: '#fff', fontSize: 8, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '2px 10px', borderRadius: 999, display: 'inline-block',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}>
                    {page.category}
                  </span>
                </div>

                {/* Items */}
                <div className="pf-page-body">
                  {page.items.map(item => (
                    <div key={item.id} className="pf-item">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="pf-item-img" />
                      ) : (
                        <div className="pf-item-img-placeholder">{categoryEmoji(page.category)}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 11, color: '#2d1a0e', lineHeight: 1.3, marginBottom: 2 }}>
                          {item.name}
                        </p>
                        {item.description && (
                          <p style={{
                            fontSize: 9, color: '#8a7060', lineHeight: 1.4, marginBottom: 4,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          } as React.CSSProperties}>
                            {item.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 11, color: '#8b4513' }}>
                            TZS {item.price.toLocaleString()}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 2,
                              background: 'linear-gradient(135deg,#c0622a,#8b4513)',
                              color: '#fff', border: 'none', borderRadius: 999,
                              padding: '3px 10px', fontSize: 9, fontWeight: 700,
                              cursor: 'pointer', boxShadow: '0 2px 6px rgba(139,69,19,0.4)',
                            }}
                          >
                            <Plus style={{ width: 9, height: 9 }} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center', fontSize: 8, color: '#c4a882', paddingBottom: 6, flexShrink: 0 }}>
                  {i + 1}
                </div>
              </div>
            </div>
          ))}

          {/* Back Cover */}
          <div className="pf-page pf-cover" data-density="hard">
            {coverImageUrl && <img src={coverImageUrl} alt="" className="pf-cover-image" />}
            <div className="pf-cover-inner justify-center">
              <p className="text-amber-200/60 italic text-base">Thank you for visiting</p>
              <p className="text-white/20 text-xs mt-2">{restaurantName}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Nav Footer */}
      <div className="book-nav">
        <button className="book-nav-btn" onClick={goPrev}>
          <ChevronLeft className="w-4 h-4 inline -mt-0.5" /> Prev
        </button>
        <span className="book-page-counter">
          {currentPage + 1} / {totalPages || '—'}
        </span>
        <button className="book-nav-btn" onClick={goNext}>
          Next <ChevronRight className="w-4 h-4 inline -mt-0.5" />
        </button>
      </div>
    </motion.div>
  );
}
