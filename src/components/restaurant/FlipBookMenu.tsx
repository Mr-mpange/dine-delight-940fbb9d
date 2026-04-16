import { useState, useCallback } from 'react';
import { animate } from 'framer-motion';
import { Plus, ShoppingCart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Link, useParams } from 'react-router-dom';
import '@/styles/flipbook.css';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}
interface MenuCategory { id: string; name: string; items: MenuItem[]; }
interface FlipBookMenuProps {
  categories: MenuCategory[];
  restaurantName: string;
  coverImageUrl?: string | null;
}

function PageContent({ page, restaurantName, coverImageUrl, onAdd }: {
  page: { type: 'cover' } | { type: 'items'; category: string; items: MenuItem[] };
  restaurantName: string;
  coverImageUrl?: string | null;
  onAdd: (item: MenuItem) => void;
}) {
  if (page.type === 'cover') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'inherit' }}>
        {coverImageUrl
          ? <img src={coverImageUrl} alt={restaurantName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#6b2d0e,#1a0a04)' }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 8px', textAlign: 'center', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>{restaurantName}</h1>
          <p style={{ color: 'rgba(255,220,150,0.85)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>Our Menu</p>
        </div>
      </div>
    );
  }
  const heroImg = page.items.find(i => i.image_url)?.image_url;
  return (
    <div style={{ width: '100%', height: '100%', background: '#faf6f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 'inherit' }}>
      {heroImg ? (
        <div style={{ position: 'relative', height: 120, flexShrink: 0 }}>
          <img src={heroImg} alt={page.category} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%)' }} />
          <span style={{ position: 'absolute', bottom: 8, left: 12, color: '#fff', fontWeight: 700, fontSize: 13, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{page.category}</span>
        </div>
      ) : (
        <div style={{ height: 40, flexShrink: 0, background: 'linear-gradient(90deg,#8b4513,#c0622a)', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{page.category}</span>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 12px', gap: 8, overflow: 'hidden' }}>
        {page.items.map((item, i) => (
          <div key={item.id} style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0, borderBottom: i < page.items.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none', paddingBottom: i < page.items.length - 1 ? 8 : 0 }}>
            {item.image_url
              ? <img src={item.image_url} alt={item.name} style={{ width: 85, height: 85, borderRadius: 10, objectFit: 'cover', flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }} />
              : <div style={{ width: 85, height: 85, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#e8d5c0,#c9a87c)' }} />
            }
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#2d1a0e', lineHeight: 1.3 }}>{item.name}</p>
              {item.description && (
                <p style={{ margin: 0, fontSize: 10, color: '#8a7060', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{item.description}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#8b4513' }}>TZS {item.price.toLocaleString()}</span>
                <button onClick={() => onAdd(item)} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'linear-gradient(135deg,#c0622a,#8b4513)', color: '#fff', border: 'none', borderRadius: 999, padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus style={{ width: 10, height: 10 }} /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FlipBookMenu({ categories, restaurantName, coverImageUrl }: FlipBookMenuProps) {
  const { dispatch, totalItems } = useCart();
  const { slug } = useParams<{ slug: string }>();
  const [current, setCurrent] = useState(0);
  const [flipping, setFlipping] = useState(false);
  // rotateY value driven imperatively
  const [rotateY, setRotateY] = useState(0);
  const [flipDir, setFlipDir] = useState<'next'|'prev'>('next');
  const [nextPage, setNextPage] = useState(0);

  const pages: Array<{ type: 'cover' } | { type: 'items'; category: string; items: MenuItem[] }> = [{ type: 'cover' }];
  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    for (let i = 0; i < items.length; i += 2)
      pages.push({ type: 'items', category: cat.name, items: items.slice(i, i + 2) });
  });

  const total = pages.length;

  const go = useCallback((dir: 'next' | 'prev') => {
    if (flipping) return;
    const target = dir === 'next' ? current + 1 : current - 1;
    if (target < 0 || target >= total) return;

    setFlipDir(dir);
    setNextPage(target);
    setFlipping(true);
    setRotateY(0);

    // Animate rotateY from 0 → -180 (next) or 0 → 180 (prev)
    const endAngle = dir === 'next' ? -180 : 180;
    animate(0, endAngle, {
      duration: 0.65,
      ease: [0.645, 0.045, 0.355, 1.0],
      onUpdate: v => setRotateY(v),
      onComplete: () => {
        setCurrent(target);
        setRotateY(0);
        setFlipping(false);
      },
    });
  }, [flipping, current, total]);

  const addToCart = (item: MenuItem) =>
    dispatch({ type: 'ADD_ITEM', payload: { menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.image_url ?? undefined } });

  const activeCat = pages[current].type === 'items' ? (pages[current] as { category: string }).category : null;
  const flipOrigin = flipDir === 'next' ? 'left center' : 'right center';
  // Show back face when past 90 degrees
  const absAngle = Math.abs(rotateY);
  const showBack = absAngle > 90;

  return (
    <div className="fb-overlay">
      {/* Header */}
      <div className="fb-header">
        <span className="fb-title">{restaurantName}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalItems > 0 && (
            <Link to={`/r/${slug}/cart`} className="fb-cart-btn">
              <ShoppingCart style={{ width: 14, height: 14 }} /> {totalItems}
            </Link>
          )}
          <Link to={`/r/${slug}`} className="fb-close-btn"><X style={{ width: 18, height: 18 }} /></Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="fb-tabs">
        {categories.map(cat => {
          const idx = pages.findIndex(p => p.type === 'items' && (p as {category:string}).category === cat.name);
          return (
            <button key={cat.id} onClick={() => !flipping && idx >= 0 && setCurrent(idx)}
              className={`fb-tab ${activeCat === cat.name ? 'fb-tab-active' : ''}`}>
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <div className="fb-stage">
        {/* Perspective wrapper — must be separate from the rotating element */}
        <div style={{ perspective: '1200px', width: '100%', maxWidth: 400, height: '100%', maxHeight: 580 }}>
          <div className="fb-book">

            {/* Layer 1: destination page (shown behind the flipping page) */}
            {flipping && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '4px 12px 12px 4px', overflow: 'hidden', zIndex: 1 }}>
                <PageContent page={pages[nextPage]} restaurantName={restaurantName} coverImageUrl={coverImageUrl} onAdd={addToCart} />
              </div>
            )}

            {/* Layer 2: current page (static, shown when not flipping) */}
            {!flipping && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '4px 12px 12px 4px', overflow: 'hidden', zIndex: 2 }}>
                <PageContent page={pages[current]} restaurantName={restaurantName} coverImageUrl={coverImageUrl} onAdd={addToCart} />
              </div>
            )}

            {/* Layer 3: the flipping page */}
            {flipping && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 3,
                transformOrigin: flipOrigin,
                transform: `rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d',
              }}>
                {/* Front face */}
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '4px 12px 12px 4px', overflow: 'hidden',
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  opacity: showBack ? 0 : 1,
                }}>
                  <PageContent page={pages[current]} restaurantName={restaurantName} coverImageUrl={coverImageUrl} onAdd={addToCart} />
                  {/* Sweep shadow */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `linear-gradient(to ${flipDir === 'next' ? 'left' : 'right'}, transparent 40%, rgba(0,0,0,${Math.sin((absAngle / 180) * Math.PI) * 0.4}) 100%)`,
                  }} />
                </div>
                {/* Back face */}
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '4px 12px 12px 4px', overflow: 'hidden',
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  opacity: showBack ? 1 : 0,
                }}>
                  <PageContent page={pages[nextPage]} restaurantName={restaurantName} coverImageUrl={coverImageUrl} onAdd={addToCart} />
                </div>
              </div>
            )}

            {/* Spine */}
            <div className="fb-spine" />
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="fb-nav">
        <button className="fb-nav-btn" onClick={() => go('prev')} disabled={current === 0 || flipping}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Prev
        </button>
        <span className="fb-counter">{current + 1} / {total}</span>
        <button className="fb-nav-btn" onClick={() => go('next')} disabled={current === total - 1 || flipping}>
          Next <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}
