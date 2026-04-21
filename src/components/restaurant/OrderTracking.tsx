import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChefHat, CheckCircle, Package, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface OrderTrackingProps {
  orderId: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  customer_name: string;
  customer_phone: string | null;
  total: number;
  created_at: string;
  table_number: string | null;
  section: string | null;
  payment_method: string | null;
  payment_status: string | null;
  restaurants: { name: string; address: string | null; phone: string | null } | null;
  order_items: OrderItem[];
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock, color: 'text-warm-gold' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-primary' },
  { key: 'ready', label: 'Ready for Pickup', icon: Package, color: 'text-accent' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-accent' },
];

export default function OrderTracking({ orderId }: OrderTrackingProps) {
  const [status, setStatus] = useState<string>('pending');
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    supabase
      .from('orders')
      .select(`
        status, customer_name, customer_phone, total, created_at,
        table_number, section, payment_method, payment_status,
        restaurants ( name, address, phone ),
        order_items ( name, quantity, price )
      `)
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        if (data) {
          setStatus(data.status ?? 'pending');
          setOrder(data as unknown as OrderDetails);
        }
      });

    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'status' in payload.new) {
          setStatus((payload.new as { status: string }).status);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const currentIndex = statusSteps.findIndex(s => s.key === status);
  const orderShortId = orderId.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md print:hidden"
      >
        <h2 className="text-2xl font-heading font-bold text-center mb-2">Order Status</h2>
        {order && (
          <p className="text-center text-muted-foreground font-body mb-6">
            Hi {order.customer_name}! Your order of TZS {Number(order.total).toLocaleString()}
          </p>
        )}

        <div className="space-y-0 relative mb-6">
          {statusSteps.map((step, i) => {
            const isActive = i <= currentIndex;
            const isCurrent = i === currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {i < statusSteps.length - 1 && (
                  <div className={`absolute left-5 top-10 w-0.5 h-12 ${isActive ? 'bg-primary' : 'bg-border'} transition-colors duration-500`} />
                )}
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-primary text-primary-foreground shadow-warm' : 'bg-muted text-muted-foreground'
                  } transition-all duration-500`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <div className="pb-12">
                  <p className={`font-heading font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-primary font-body mt-1"
                    >
                      Current status
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {order && (
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="w-full rounded-xl py-6"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        )}
      </motion.div>

      {/* Print-only receipt */}
      {order && (
        <div className="hidden print:block print:w-full print:p-6 font-mono text-sm text-black">
          <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
            <h1 className="text-xl font-bold">{order.restaurants?.name ?? 'Receipt'}</h1>
            {order.restaurants?.address && <p className="text-xs">{order.restaurants.address}</p>}
            {order.restaurants?.phone && <p className="text-xs">Tel: {order.restaurants.phone}</p>}
          </div>

          <div className="mb-3 text-xs space-y-1">
            <div className="flex justify-between"><span>Order #:</span><span className="font-bold">{orderShortId}</span></div>
            <div className="flex justify-between"><span>Date:</span><span>{new Date(order.created_at).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Customer:</span><span>{order.customer_name}</span></div>
            {order.customer_phone && <div className="flex justify-between"><span>Phone:</span><span>{order.customer_phone}</span></div>}
            {order.section && <div className="flex justify-between"><span>Section:</span><span>{order.section}</span></div>}
            {order.table_number && <div className="flex justify-between"><span>Table:</span><span>{order.table_number}</span></div>}
            <div className="flex justify-between"><span>Payment:</span><span className="uppercase">{order.payment_method}</span></div>
          </div>

          <div className="border-t border-b border-dashed border-black py-2 my-2">
            <div className="flex justify-between font-bold text-xs mb-1">
              <span>ITEM</span><span>TOTAL</span>
            </div>
            {order.order_items.map((it, idx) => (
              <div key={idx} className="text-xs mb-1">
                <div className="flex justify-between">
                  <span>{it.name}</span>
                  <span>TZS {(it.price * it.quantity).toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-gray-700">  {it.quantity} × TZS {Number(it.price).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold text-base mt-2">
            <span>TOTAL</span>
            <span>TZS {Number(order.total).toLocaleString()}</span>
          </div>

          {order.payment_status === 'cash_pending' && (
            <p className="text-center text-xs mt-3 italic">** PAY CASH ON DELIVERY **</p>
          )}

          <div className="text-center mt-4 pt-3 border-t-2 border-dashed border-black text-xs">
            <p>Thank you for your order!</p>
            <p className="mt-1 text-[10px]">Show this receipt to staff</p>
          </div>
        </div>
      )}
    </div>
  );
}
