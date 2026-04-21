import { useEffect, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';
import { Plus, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Link, useParams } from 'react-router-dom';
import ReactDOM from 'react-dom';
import '@/styles/flipbook.css';

interface MenuItem {
  id: string; name: string; description: string | null;
  price: number; image_url: string | null; is_available: boolean;
}
interface MenuCategory { id: string; name: string; items: MenuItem[]; }
interface FlipBookMenuProps {
  categories: MenuCategory[]; restaurantName: string; coverImageUrl?: string | null;
}

export default function FlipBookMenu({ categories, restaurantName, coverImageUrl }: FlipBookMenuProps) {
  const { dispatch, totalItems } = useCart();
  const { slug } = useParams<{ slug: string }>();
  const bookRef = useRef<HTMLDivElement>(null);
  const pfRef = useRef<PageFlip | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [total, setTotal] = useState(0);

  // Build page data
  type Page =
    | { type: 'cover' }
    | { type: 'back' }
    | { type: 'items'; category: string; items: MenuItem[] };
  const pages: Page[] = [];
  pages.push({ type: 'cover' });
  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    for (let i = 0; i < items.length; i += 2)
      pages.push({ type: 'items', category: cat.name, items: items.slice(i, i + 2) });
  });
  pages.push({ type: 'back' });

  const addToCart = (item: MenuItem) =>
    dispatch({ type: 'ADD_ITEM', payload: { menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.image_url ?? undefined } });

  useEffect(() => {
    if (!bookRef.current) return;

    const container = bookRef.current;
    container.innerHTML = '';

    pages.forEach((page, idx) => {
      const div = document.createElement('div');

      if (page.type === 'cover') {
        div.className = 'pf-page pf-cover';
        div.setAttribute('data-density', 'hard');
        div.innerHTML = `
          <div class="pf-cover-inner">
            ${coverImageUrl ? `<img src="${coverImageUrl}" class="pf-cover-bg" alt="" />` : ''}
            <div class="pf-cover-overlay">
              <h1>${restaurantName}</h1>
              <p>Our Menu</p>
              <span>Drag corners to turn pages</span>
            </div>
          </div>`;
      } else if (page.type === 'back') {
        div.className = 'pf-page pf-cover';
        div.setAttribute('data-density', 'hard');
        div.innerHTML = `
          <div class="pf-cover-inner">
            ${coverImageUrl ? `<img src="${coverImageUrl}" class="pf-cover-bg" alt="" />` : ''}
            <div class="pf-cover-overlay">
              <h1>Thank You</h1>
              <p>${restaurantName}</p>
            </div>
          </div>`;
      } else {
        div.className = 'pf-page pf-menu';
        const heroImg = page.items.find(i => i.image_url)?.image_url;
        const heroHtml = heroImg
          ? `<div class="pf-hero"><img src="${heroImg}" alt="${page.category}" /><span>${page.category}</span></div>`
          : `<div class="pf-hero-plain">${page.category}</div>`;

        const itemsHtml = page.items.map(item => `
          <div class="pf-item" data-id="${item.id}">
            ${item.image_url
              ? `<img src="${item.image_url}" alt="${item.name}" class="pf-item-img" />`
              : `<div class="pf-item-img pf-item-img-empty"></div>`}
            <div class="pf-item-info">
              <p class="pf-item-name">${item.name}</p>
              ${item.description ? `<p class="pf-item-desc">${item.description}</p>` : ''}
              <div class="pf-item-row">
                <span class="pf-item-price">TZS ${item.price.toLocaleString()}</span>
                <button class="pf-add-btn" data-id="${item.id}">+ Add</button>
              </div>
            </div>
          </div>`).join('');

        div.innerHTML = `${heroHtml}<div class="pf-items">${itemsHtml}</div>`;

        // Wire up Add buttons after DOM insert
        setTimeout(() => {
          div.querySelectorAll<HTMLButtonElement>('.pf-add-btn').forEach(btn => {
            const id = btn.dataset.id!;
            const item = page.items.find(i => i.id === id);
            if (item) btn.addEventListener('click', (e) => {
              e.stopPropagation();
              addToCart(item);
            });
          });
        }, 0);
      }

      container.appendChild(div);
    });

    // Detect mobile — use portrait (single-page) so the book fills the screen
    const isMobile = window.innerWidth < 768;

    const pf = new PageFlip(container, {
      width: 350,
      height: 500,
      size: 'stretch',
      minWidth: 280,
      maxWidth: 800,
      minHeight: 400,
      maxHeight: 1200,
      drawShadow: true,
      maxShadowOpacity: 0.5,
      flippingTime: 1000,
      swipeDistance: 30,
      showCover: true,
      usePortrait: isMobile,
      mobileScrollSupport: false,
      autoSize: true,
    });

    pf.loadFromHTML(container.querySelectorAll<HTMLElement>('.pf-page'));
    pf.on('flip', (e) => setPageNum((e as unknown as { data: number }).data));
    setTotal(pf.getPageCount());
    pfRef.current = pf;

    return () => {
      pf.destroy();
      pfRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, restaurantName, coverImageUrl]);

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
          <Link to={`/r/${slug}`} className="fb-close-btn">
            <X style={{ width: 18, height: 18 }} />
          </Link>
        </div>
      </div>

      {/* Book stage — PageFlip owns everything inside bookRef */}
      <div className="fb-stage">
        <div ref={bookRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
      </div>

      {/* Nav */}
      <div className="fb-nav">
        <button className="fb-nav-btn" onClick={() => pfRef.current?.flipPrev()} disabled={pageNum === 0}>
          ← Prev
        </button>
        <span className="fb-counter">{pageNum + 1} / {total || '—'}</span>
        <button className="fb-nav-btn" onClick={() => pfRef.current?.flipNext()} disabled={pageNum >= total - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}
