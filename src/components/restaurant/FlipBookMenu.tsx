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
    | { type: 'toc'; entries: { category: string; page: number }[] }
    | { type: 'items'; category: string; items: MenuItem[] };
  const pages: Page[] = [];
  pages.push({ type: 'cover' });

  // Build item pages first so we can compute TOC page numbers
  const itemPages: Page[] = [];
  const tocEntries: { category: string; page: number }[] = [];
  // page 1 = cover, page 2 = TOC, items start at page 3 (1-indexed for display)
  let currentPageNum = 3;
  categories.forEach(cat => {
    const items = cat.items.filter(i => i.is_available);
    if (items.length === 0) return;
    tocEntries.push({ category: cat.name, page: currentPageNum });
    for (let i = 0; i < items.length; i += 2) {
      itemPages.push({ type: 'items', category: cat.name, items: items.slice(i, i + 2) });
      currentPageNum++;
    }
  });
  pages.push({ type: 'toc', entries: tocEntries });
  pages.push(...itemPages);
  // Ensure even total page count so the back hard cover lands on the right side
  if (pages.length % 2 !== 0) {
    pages.push({ type: 'items', category: '', items: [] });
  }
  pages.push({ type: 'back' });

  const addToCart = (item: MenuItem) =>
    dispatch({ type: 'ADD_ITEM', payload: { menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.image_url ?? undefined } });

  useEffect(() => {
    if (!bookRef.current) return;

    const container = bookRef.current;
    container.innerHTML = '';

    // Allow only http(s) image URLs to prevent javascript:/data: protocol XSS
    const safeImgUrl = (url: string | null | undefined): string | null => {
      if (!url) return null;
      try {
        const u = new URL(url, window.location.origin);
        return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
      } catch {
        return null;
      }
    };

    const el = (tag: string, className?: string, text?: string) => {
      const e = document.createElement(tag);
      if (className) e.className = className;
      if (text != null) e.textContent = text;
      return e;
    };

    pages.forEach((page) => {
      const div = document.createElement('div');

      if (page.type === 'cover' || page.type === 'back') {
        div.className = 'pf-page pf-cover';
        div.setAttribute('data-density', 'hard');
        const inner = el('div', 'pf-cover-inner');
        const safeCover = safeImgUrl(coverImageUrl);
        if (safeCover) {
          const img = document.createElement('img');
          img.src = safeCover;
          img.className = 'pf-cover-bg';
          img.alt = '';
          inner.appendChild(img);
        }
        const overlay = el('div', 'pf-cover-overlay');
        if (page.type === 'cover') {
          overlay.appendChild(el('h1', undefined, restaurantName));
          overlay.appendChild(el('p', undefined, 'Our Menu'));
          overlay.appendChild(el('span', undefined, 'Drag corners to turn pages'));
        } else {
          overlay.appendChild(el('h1', undefined, 'Thank You'));
          overlay.appendChild(el('p', undefined, restaurantName));
        }
        inner.appendChild(overlay);
        div.appendChild(inner);
      } else if (page.type === 'toc') {
        div.className = 'pf-page pf-toc';
        const tocHeader = el('div', 'pf-toc-header');
        tocHeader.appendChild(el('h2', undefined, 'Table of Contents'));
        tocHeader.appendChild(el('div', 'pf-toc-divider'));
        div.appendChild(tocHeader);

        const tocList = el('ul', 'pf-toc-list');
        page.entries.forEach((entry, idx) => {
          const li = document.createElement('li');
          li.className = 'pf-toc-item';
          const num = el('span', 'pf-toc-num', String(idx + 1).padStart(2, '0'));
          const name = el('span', 'pf-toc-name', entry.category);
          const dots = el('span', 'pf-toc-dots');
          const pageN = el('span', 'pf-toc-page', String(entry.page));
          li.appendChild(num);
          li.appendChild(name);
          li.appendChild(dots);
          li.appendChild(pageN);
          li.addEventListener('click', () => {
            // page-flip is 0-indexed; entry.page is 1-indexed display number
            pfRef.current?.flip(entry.page - 1);
          });
          tocList.appendChild(li);
        });
        div.appendChild(tocList);
      } else {
        div.className = 'pf-page pf-menu';

        // Hero
        const heroImgUrl = safeImgUrl(page.items.find(i => i.image_url)?.image_url);
        if (heroImgUrl) {
          const hero = el('div', 'pf-hero');
          const img = document.createElement('img');
          img.src = heroImgUrl;
          img.alt = page.category;
          hero.appendChild(img);
          hero.appendChild(el('span', undefined, page.category));
          div.appendChild(hero);
        } else if (page.category) {
          div.appendChild(el('div', 'pf-hero-plain', page.category));
        }

        // Items
        const itemsWrap = el('div', 'pf-items');
        page.items.forEach(item => {
          const itemDiv = el('div', 'pf-item');
          itemDiv.dataset.id = item.id;

          const itemImg = safeImgUrl(item.image_url);
          if (itemImg) {
            const img = document.createElement('img');
            img.src = itemImg;
            img.alt = item.name;
            img.className = 'pf-item-img';
            itemDiv.appendChild(img);
          } else {
            itemDiv.appendChild(el('div', 'pf-item-img pf-item-img-empty'));
          }

          const info = el('div', 'pf-item-info');
          info.appendChild(el('p', 'pf-item-name', item.name));
          if (item.description) {
            info.appendChild(el('p', 'pf-item-desc', item.description));
          }
          const row = el('div', 'pf-item-row');
          row.appendChild(el('span', 'pf-item-price', `TZS ${item.price.toLocaleString()}`));
          const btn = document.createElement('button');
          btn.className = 'pf-add-btn';
          btn.textContent = '+ Add';
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(item);
          });
          row.appendChild(btn);
          info.appendChild(row);
          itemDiv.appendChild(info);
          itemsWrap.appendChild(itemDiv);
        });
        div.appendChild(itemsWrap);
      }

      container.appendChild(div);
    });

    // Detect mobile — use portrait (single-page) so the book fills the screen
    const isMobile = window.innerWidth < 768;

    // On small screens, soft covers + showCover:false avoids the
    // "detached cover" artifact during open/close in portrait mode.
    // page-flip animates hard covers separately from soft pages, which
    // looks broken on a single-page (portrait) layout. Treating the
    // cover as a regular soft page makes the open/close turn smoothly.
    if (isMobile) {
      container.querySelectorAll<HTMLElement>('.pf-cover').forEach(c => {
        c.removeAttribute('data-density');
        c.classList.add('pf-cover-soft');
      });
    }

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
      showCover: !isMobile,
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
