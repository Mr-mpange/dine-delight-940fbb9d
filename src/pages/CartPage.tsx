import { useParams } from 'react-router-dom';
import CartDrawer from '@/components/restaurant/CartDrawer';

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  return <CartDrawer restaurantSlug={slug || ''} />;
}
