import { useRef, useEffect, useCallback, useState } from 'react';
import { PageFlip } from 'page-flip';
import { Plus, ShoppingCart, ChevronLeft, ChevronRight, X } from 'lucide-react';
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

export default function FlipBookMenu({ categories, restaurantName, coverImageUrl }: FlipBookMenuProps) {
  const bookRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { dispatch, totalItems } = useCart();
  const { slug } = useParams<{ slug: string }>();

  // 2 items per page
  const allPages: { category: string; items: MenuItem[] }[] = [];
  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    for (let i = 0; i < items.length; i += 2) {
      allPages.push({ category: cat.name, items: items.slice(i, i + 2) });
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
        minWidth: 140,
        maxWidth: 400,
        minHeight: 220,
        maxHeight: 580,
        drawShadow: true,
        maxShadowOpacity: 0.5,
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
    <div className="book-overlay">

      {/* ── Header ── */}
      <div className="book-header">
        <span className="text-white font-semibold text-sm truncate max-w-[200px]">{restaurantName}</span>
        <div className="flex items-center gap-4">
          {totalItems > 0 && (
            <Link to={`/r/${slug}/cart`} className="flex items-center gap-1.5 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              <ShoppingCart className="w-3.5 h-3.5" /> {totalItems}
            </Link>
          )}
          <Link to={`/r/${slug}`} className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="book-tabs">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => jumpToCategory(cat.name)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.name ? 'bg-amber-500 text-black' : 'text-white/50 border border-white/10'
            }`}
            style={{ background: activeCategory === cat.name ? undefined : 'rgba(255,255,255,0.06)' }}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Book Stage ── */}
      <div className="book-stage">
        {/* These divs are READ by PageFlip then hidden — it renders its own canvas */}
        <div ref={bookRef} className="pf-book">

          {/* Front Cover */}
          <div className="pf-page pf-cover" data-density="hard">
            <div className="pf-cover-inner">
              {coverImageUrl
                ? <img src={coverImageUrl} alt={restaurantName} className="pf-cover-bg" />
                : <div className="pf-cover-bg" style={{ background: 'linear-gradient(160deg,#6b2d0e,#1a0a04)' }} />
              }
              <div className="pf-cover-text">
                <h1>{restaurantName}</h1>
                <p>Our Menu</p>
              </div>
            </div>
          </div>

          {/* Menu Pages */}
          {allPages.map((page, i) => (
            <div key={i} className="pf-page">
              <div className="pf-page-inner">
                {/* Category label */}
                <div className="pf-cat-label">{page.category}</div>

                {/* Items */}
                {page.items.map(item => (
                  <div key={item.id} className="pf-item">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} className="pf-item-img" />
                      : <div className="pf-item-img pf-item-img-empty" />
                    }
                    <div className="pf-item-info">
                      <p className="pf-item-name">{item.name}</p>
                      {item.description && <p className="pf-item-desc">{item.description}</p>}
                      <div className="pf-item-row">
                        <span className="pf-item-price">TZS {item.price.toLocaleString()}</span>
                        <button className="pf-add-btn" onClick={() => addToCart(item)}>
                          <Plus style={{ width: 9, height: 9 }} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pf-page-num">{i + 1}</div>
              </div>
            </div>
          ))}

          {/* Back Cover */}
          <div className="pf-page pf-cover" data-density="hard">
            <div className="pf-cover-inner">
              {coverImageUrl
                ? <img src={coverImageUrl} alt="" className="pf-cover-bg" />
                : <div className="pf-cover-bg" style={{ background: 'linear-gradient(160deg,#6b2d0e,#1a0a04)' }} />
              }
              <div className="pf-cover-text">
                <p>Thank you</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Nav ── */}
      <div className="book-nav">
        <button className="book-nav-btn" onClick={goPrev}>
          <ChevronLeft className="w-4 h-4 inline" /> Prev
        </button>
        <span className="book-page-counter">{currentPage + 1} / {totalPages || '—'}</span>
        <button className="book-nav-btn" onClick={goNext}>
          Next <ChevronRight className="w-4 h-4 inline" />
        </button>
      </div>

    </div>
  );
}
