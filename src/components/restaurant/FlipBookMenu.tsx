import { useState, useCallback } from 'react';
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

// ─── Page content renderer ───────────────────────────────────────────────────
function PageContent({
  page,
  restaurantName,
  coverImageUrl,
  onAdd,
}: {
  page: { type: 'cover' } | { type: 'items'; category: string; items: MenuItem[] };
  restaurantName: string;
  coverImageUrl?: string | null;
  onAdd: (item: MenuItem) => void;
}) {
  if (page.type === 'cover') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        {coverImageUrl
          ? <img src={coverImageUrl} alt={restaurantName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#6b2d0e,#1a0a04)' }} />
        }
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 8px', textAlign: 'center', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
            {restaurantName}
          </h1>
          <p style={{ color: 'rgba(255,220,150,0.85)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>Our Menu</p>
        </div>
      </div>
    );
  }

  const heroImg = page.items.find(i => i.image_url)?.image_url;

  return (
    <div style={{ width: '100%', height: '100%', background: '#faf6f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Hero banner */}
      {heroImg ? (
        <div style={{ position: 'relative', height: 120, flexShrink: 0 }}>
          <img src={heroImg} alt={page.category} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%)' }} />
          <span style={{ position: 'absolute', bottom: 8, left: 12, color: '#fff', fontWeight: 700, fontSize: 13, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
            {page.category}
          </span>
        </div>
      ) : (
        <div style={{ height: 40, flexShrink: 0, background: 'linear-gradient(90deg,#8b4513,#c0622a)', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{page.category}</span>
        </div>
      )}

      {/* Items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 12px', gap: 8, overflow: 'hidden' }}>
        {page.items.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', gap: 10, flex: 1, minHeight: 0,
            borderBottom: i < page.items.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none',
            paddingBottom: i < page.items.length - 1 ? 8 : 0,
          }}>
            {item.image_url
              ? <img src={item.image_url} alt={item.name} style={{ width: 85, height: 85, borderRadius: 10, objectFit: 'cover', flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }} />
              : <div style={{ width: 85, height: 85, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#e8d5c0,#c9a87c)' }} />
            }
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#2d1a0e', lineHeight: 1.3 }}>{item.name}</p>
              {item.description && (
                <p style={{ margin: 0, fontSize: 10, color: '#8a7060', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                  {item.description}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#8b4513' }}>TZS {item.price.toLocaleString()}</span>
                <button onClick={() => onAdd(item)} style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  background: 'linear-gradient(135deg,#c0622a,#8b4513)',
                  color: '#fff', border: 'none', borderRadius: 999,
                  padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function FlipBookMenu({ categories, restaurantName, coverImageUrl }: FlipBookMenuProps) {
  const { dispatch, totalItems } = useCart();
  const { slug } = useParams<{ slug: string }>();

  // page index of the LEFT visible page (0 = cover)
  const [current, setCurrent] = useState(0);
  // flip state: null = idle, 'next' = right page peeling left, 'prev' = left page peeling right
  const [flipDir, setFlipDir] = useState<'next' | 'prev' | null>(null);
  // 0→1 animation progress driven by CSS
  const [flipping, setFlipping] = useState(false);

  const pages: Array<{ type: 'cover' } | { type: 'items'; category: string; items: MenuItem[] }> = [
    { type: 'cover' },
  ];
  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    for (let i = 0; i < items.length; i += 2) {
      pages.push({ type: 'items', category: cat.name, items: items.slice(i, i + 2) });
    }
  });

  const total = pages.length;
  const canNext = current < total - 1;
  const canPrev = current > 0;

  const go = useCallback((dir: 'next' | 'prev') => {
    if (flipping) return;
    if (dir === 'next' && !canNext) return;
    if (dir === 'prev' && !canPrev) return;
    setFlipDir(dir);
    setFlipping(true);
    setTimeout(() => {
      setCurrent(p => dir === 'next' ? p + 1 : p - 1);
      setFlipping(false);
      setFlipDir(null);
    }, 600);
  }, [flipping, canNext, canPrev]);

  const addToCart = (item: MenuItem) => {
    dispatch({ type: 'ADD_ITEM', payload: { menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.image_url ?? undefined } });
  };

  // The page being flipped away (front) and revealed (back)
  const flipFromPage = flipDir === 'next' ? pages[current] : pages[current];
  const flipToPage   = flipDir === 'next' ? pages[current + 1] : pages[current - 1];
  const activeCat    = pages[current].type === 'items' ? pages[current].category : null;

  return (
    <div className="fb-overlay">

      {/* ── Header ── */}
      <div className="fb-header">
        <span className="fb-title">{restaurantName}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalItems > 0 && (
            <Link to={`/r/${slug}/cart`} className="fb-cart-btn">
              <ShoppingCart style={{ width: 14, height: 14 }} /> {totalItems}
            </Link>
          )}
          <Link to={`/r/${slug}`} className="fb-close-btn">
            <X style={{ width: 18, height: 18 }} />
          </Link>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="fb-tabs">
        {categories.map(cat => {
          const idx = pages.findIndex(p => p.type === 'items' && p.category === cat.name);
          return (
            <button key={cat.id}
              onClick={() => !flipping && idx >= 0 && setCurrent(idx)}
              className={`fb-tab ${activeCat === cat.name ? 'fb-tab-active' : ''}`}>
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ── Book stage ── */}
      <div className="fb-stage">
        <div className="fb-book">

          {/* Static current page (always visible underneath) */}
          <div className="fb-page fb-page-static">
            <PageContent page={pages[current]} restaurantName={restaurantName} coverImageUrl={coverImageUrl} onAdd={addToCart} />
          </div>

          {/* The page being revealed (next/prev) — sits behind the flipping page */}
          {flipping && flipToPage && (
            <div className="fb-page fb-page-behind">
              <PageContent page={flipToPage} restaurantName={restaurantName} coverImageUrl={coverImageUrl} onAdd={addToCart} />
            </div>
          )}

          {/* The flipping page — rotates around its left edge (next) or right edge (prev) */}
          {flipping && (
            <div
              className={`fb-page fb-page-flip ${flipDir === 'next' ? 'fb-flip-next' : 'fb-flip-prev'}`}
            >
              {/* Front face = current page */}
              <div className="fb-flip-front">
                <PageContent page={flipFromPage} restaurantName={restaurantName} coverImageUrl={coverImageUrl} onAdd={addToCart} />
                {/* Shadow that darkens as page turns */}
                <div className="fb-flip-shadow" />
              </div>
              {/* Back face = next/prev page (mirrored) */}
              <div className="fb-flip-back">
                <PageContent page={flipToPage!} restaurantName={restaurantName} coverImageUrl={coverImageUrl} onAdd={addToCart} />
              </div>
            </div>
          )}

          {/* Spine */}
          <div className="fb-spine" />
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="fb-nav">
        <button className="fb-nav-btn" onClick={() => go('prev')} disabled={!canPrev || flipping}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Prev
        </button>
        <span className="fb-counter">{current + 1} / {total}</span>
        <button className="fb-nav-btn" onClick={() => go('next')} disabled={!canNext || flipping}>
          Next <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      </div>

    </div>
  );
}
