import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';

interface CartDrawerProps {
  restaurantSlug: string;
}

export default function CartDrawer({ restaurantSlug }: CartDrawerProps) {
  const { state, dispatch, totalItems, totalPrice } = useCart();

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-heading font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground font-body mb-6">Add some delicious items from the menu</p>
        <Button variant="hero" asChild>
          <Link to={`/r/${restaurantSlug}/menu`}>Browse Menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 py-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-xl font-heading font-semibold">Your Order</h2>
        <p className="text-sm text-muted-foreground font-body">{totalItems} items</p>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {state.items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-4 flex gap-3 shadow-warm border border-border"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover"
                loading="lazy"
                width={64}
                height={64}
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-body font-semibold truncate">{item.name}</h4>
              <p className="text-primary font-body font-bold text-sm">
                TZS {(item.price * item.quantity).toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: item.quantity - 1 } })}
                  className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-body font-semibold text-sm w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: item.quantity + 1 } })}
                  className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}
                  className="ml-auto text-destructive hover:text-destructive/80 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4 space-y-3 sticky bottom-0">
        <div className="flex justify-between font-body">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-bold">TZS {totalPrice.toLocaleString()}</span>
        </div>
        <Button variant="hero" size="lg" className="w-full rounded-xl py-6 text-lg" asChild>
          <Link to={`/r/${restaurantSlug}/checkout`}>
            Proceed to Checkout
          </Link>
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link to={`/r/${restaurantSlug}/menu`}>Continue Browsing</Link>
        </Button>
      </div>
    </div>
  );
}
