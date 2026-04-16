import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Phone, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CheckoutPageProps {
  restaurantId: string;
  restaurantSlug: string;
  commissionRate: number;
}

const paymentMethods = [
  { id: 'mpesa', name: 'M-Pesa', icon: '📱' },
  { id: 'airtel', name: 'Airtel Money', icon: '📲' },
  { id: 'tigo', name: 'Tigo Pesa', icon: '💳' },
  { id: 'demo', name: 'Demo (No Payment)', icon: '🧪' },
];

export default function CheckoutPage({ restaurantId, restaurantSlug, commissionRate }: CheckoutPageProps) {
  const { state, totalPrice, dispatch } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [section, setSection] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [step, setStep] = useState<'details' | 'processing' | 'success' | 'failed'>('details');
  const [orderId, setOrderId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setStep('processing');

    // Mock delay — no real payment gateway is called
    await new Promise(resolve => setTimeout(resolve, 1500));

    const commission = totalPrice * (commissionRate / 100);

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          customer_name: name,
          customer_phone: phone,
          total: totalPrice,
          commission,
          payment_method: paymentMethod,
          payment_status: 'demo', // mock — not a real transaction
          status: 'pending',
          section: section || null,
          table_number: tableNumber || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert order items
      const orderItems = state.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      await supabase.from('order_items').insert(orderItems);

      setOrderId(order.id);
      setStep('success');
      dispatch({ type: 'CLEAR_CART' });
    } catch {
      setStep('failed');
    }
  };

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-16 h-16 text-primary" />
        </motion.div>
        <h2 className="text-xl font-heading font-semibold mt-6">Placing Order...</h2>
        <p className="text-muted-foreground font-body mt-2">Hang tight, almost done</p>
        <span className="mt-4 inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-300">
          🧪 Demo Mode — no real payment is charged
        </span>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          <CheckCircle className="w-20 h-20 text-accent" />
        </motion.div>
        <h2 className="text-2xl font-heading font-bold mt-6">Order Confirmed!</h2>
        <p className="text-muted-foreground font-body mt-2">
          Your order has been placed successfully
        </p>
        {orderId && (
          <Button variant="hero" className="mt-6" onClick={() => navigate(`/r/${restaurantSlug}/track/${orderId}`)}>
            Track Your Order
          </Button>
        )}
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-20 h-20 text-destructive" />
        <h2 className="text-2xl font-heading font-bold mt-6">Payment Failed</h2>
        <p className="text-muted-foreground font-body mt-2">Something went wrong. Please try again.</p>
        <Button variant="hero" className="mt-6" onClick={() => setStep('details')}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-xl font-heading font-semibold">Checkout</h2>
        <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 mt-2 font-body">
          🧪 Demo Mode — no real payment will be processed
        </p>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Customer Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h3 className="font-heading font-semibold">Your Details</h3>
          <Input
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="rounded-xl h-12 font-body"
          />
          <Input
            placeholder="Phone Number (e.g., +255...)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="rounded-xl h-12 font-body"
          />
        </motion.div>

        {/* Table / Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
          <h3 className="font-heading font-semibold">Your Location</h3>
          <div className="grid grid-cols-3 gap-2">
            {['Indoor', 'Outdoor', 'VIP'].map(s => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`p-3 rounded-xl border-2 text-sm font-body font-semibold transition-all ${
                  section === s
                    ? 'border-primary bg-primary/5 shadow-warm'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Input
            placeholder="Table Number (e.g., 5)"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            className="rounded-xl h-12 font-body"
          />
        </motion.div>

        {/* Payment Method */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
          <h3 className="font-heading font-semibold">Payment Method</h3>
          <div className="grid gap-3">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all font-body ${
                  paymentMethod === method.id
                    ? 'border-primary bg-primary/5 shadow-warm'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="font-semibold">{method.name}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl p-4 border border-border space-y-2">
          <h3 className="font-heading font-semibold mb-3">Order Summary</h3>
          {state.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm font-body">
              <span>{item.name} × {item.quantity}</span>
              <span>TZS {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 mt-2 flex justify-between font-body font-bold">
            <span>Total</span>
            <span className="text-primary">TZS {totalPrice.toLocaleString()}</span>
          </div>
        </motion.div>

        <Button variant="hero" size="lg" className="w-full rounded-xl py-6 text-lg" onClick={handleSubmit}>
          🧪 Place Demo Order — TZS {totalPrice.toLocaleString()}
        </Button>
      </div>
    </div>
  );
}
