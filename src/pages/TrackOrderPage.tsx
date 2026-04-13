import { useParams } from 'react-router-dom';
import OrderTracking from '@/components/restaurant/OrderTracking';

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  if (!orderId) return null;
  return <OrderTracking orderId={orderId} />;
}
