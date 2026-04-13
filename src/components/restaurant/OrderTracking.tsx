import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChefHat, CheckCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrderTrackingProps {
  orderId: string;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock, color: 'text-warm-gold' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-primary' },
  { key: 'ready', label: 'Ready for Pickup', icon: Package, color: 'text-accent' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-accent' },
];

export default function OrderTracking({ orderId }: OrderTrackingProps) {
  const [status, setStatus] = useState<string>('pending');
  const [order, setOrder] = useState<{ customer_name: string; total: number; created_at: string } | null>(null);

  useEffect(() => {
    // Fetch initial order
    supabase
      .from('orders')
      .select('status, customer_name, total, created_at')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        if (data) {
          setStatus(data.status ?? 'pending');
          setOrder(data);
        }
      });

    // Subscribe to realtime updates
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h2 className="text-2xl font-heading font-bold text-center mb-2">Order Status</h2>
        {order && (
          <p className="text-center text-muted-foreground font-body mb-8">
            Hi {order.customer_name}! Your order of TZS {Number(order.total).toLocaleString()}
          </p>
        )}

        <div className="space-y-0 relative">
          {statusSteps.map((step, i) => {
            const isActive = i <= currentIndex;
            const isCurrent = i === currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {/* Line */}
                {i < statusSteps.length - 1 && (
                  <div className={`absolute left-5 top-10 w-0.5 h-12 ${isActive ? 'bg-primary' : 'bg-border'} transition-colors duration-500`} />
                )}

                {/* Icon */}
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-primary text-primary-foreground shadow-warm' : 'bg-muted text-muted-foreground'
                  } transition-all duration-500`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>

                {/* Label */}
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
      </motion.div>
    </div>
  );
}
