import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList, BarChart3,
  LogOut, Plus, Trash2, Clock, CheckCircle, QrCode, Store, MapPin,
} from 'lucide-react';
import QRCodeCard from '@/components/restaurant/QRCodeCard';
import { useNavigate } from 'react-router-dom';

type Tab = 'orders' | 'menu' | 'qr' | 'stats';

export default function RestaurantDashboard() {
  const { user, signOut, userRole, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const navigate = useNavigate();

  // Redirect based on role
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    } else if (!loading && userRole === 'super_admin') {
      navigate('/super-admin', { replace: true });
    } else if (!loading && userRole === 'customer') {
      navigate('/', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['my-restaurant', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user && userRole === 'restaurant_admin',
  });

  if (loading || restaurantLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading dashboard...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <CreateRestaurantPanel userId={user!.id} onSignOut={signOut} />
      </div>
    );
  }

  const tabs = [
    { id: 'orders' as Tab, label: 'Orders', icon: ClipboardList },
    { id: 'menu' as Tab, label: 'Menu', icon: UtensilsCrossed },
    { id: 'qr' as Tab, label: 'QR Code', icon: QrCode },
    { id: 'stats' as Tab, label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          <h1 className="font-heading font-bold text-lg truncate">{restaurant.name}</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-body font-medium transition-all ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {activeTab === 'orders' && <OrdersPanel restaurantId={restaurant.id} />}
        {activeTab === 'menu' && <MenuPanel restaurantId={restaurant.id} />}
        {activeTab === 'qr' && (
          <QRCodeCard
            restaurantName={restaurant.name}
            slug={restaurant.slug}
            logoUrl={restaurant.logo_url}
            address={restaurant.address}
            phone={restaurant.phone}
          />
        )}
        {activeTab === 'stats' && <StatsPanel restaurantId={restaurant.id} />}
      </div>
    </div>
  );
}

function OrdersPanel({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders } = useQuery({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status: status as 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
      toast({ title: 'Order updated' });
    },
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-warm-gold/10 text-warm-gold border-warm-gold/20',
    preparing: 'bg-primary/10 text-primary border-primary/20',
    ready: 'bg-accent/10 text-accent border-accent/20',
    delivered: 'bg-muted text-muted-foreground border-border',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const nextStatus: Record<string, string> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'delivered',
  };

  return (
    <div className="space-y-3">
      <h2 className="font-heading font-semibold text-lg">Incoming Orders</h2>
      {orders?.map((order, i) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-xl p-4 border border-border shadow-warm"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-body font-semibold">{order.customer_name}</p>
              <p className="text-sm text-muted-foreground font-body">{order.customer_phone}</p>
              {(order.section || order.table_number) && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span className="text-xs font-body text-primary font-medium">
                    {[order.section, order.table_number ? `Table ${order.table_number}` : ''].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
            <Badge className={statusColors[order.status ?? 'pending']}>
              {order.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="font-body font-bold text-primary">TZS {Number(order.total).toLocaleString()}</span>
            {order.status && nextStatus[order.status] && (
              <Button
                variant="hero"
                size="sm"
                className="rounded-full"
                onClick={() => updateStatus.mutate({ id: order.id, status: nextStatus[order.status!] })}
              >
                Mark {nextStatus[order.status]}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-body mt-2">
            {new Date(order.created_at!).toLocaleString()}
          </p>
        </motion.div>
      ))}
      {(!orders || orders.length === 0) && (
        <div className="text-center py-12 text-muted-foreground font-body">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No orders yet
        </div>
      )}
    </div>
  );
}

function MenuPanel({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '' });

  const { data: categories } = useQuery({
    queryKey: ['admin-menu', restaurantId],
    queryFn: async () => {
      const { data: cats } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');
      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');
      return (cats || []).map(cat => ({
        ...cat,
        items: (items || []).filter(item => item.category_id === cat.id),
      }));
    },
  });

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const { error } = await supabase.from('menu_categories').insert({ restaurant_id: restaurantId, name: newCatName });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setNewCatName('');
    setShowAddCategory(false);
    queryClient.invalidateQueries({ queryKey: ['admin-menu', restaurantId] });
    toast({ title: 'Category added' });
  };

  const addItem = async (categoryId: string) => {
    if (!newItem.name.trim() || !newItem.price) return;
    const { error } = await supabase.from('menu_items').insert({
      restaurant_id: restaurantId,
      category_id: categoryId,
      name: newItem.name,
      price: parseFloat(newItem.price),
      description: newItem.description || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setNewItem({ name: '', price: '', description: '' });
    setShowAddItem(null);
    queryClient.invalidateQueries({ queryKey: ['admin-menu', restaurantId] });
    toast({ title: 'Item added' });
  };

  const deleteItem = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-menu', restaurantId] });
    toast({ title: 'Item deleted' });
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('menu_categories').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-menu', restaurantId] });
    toast({ title: 'Category deleted' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg">Menu Management</h2>
        <Button variant="hero" size="sm" onClick={() => setShowAddCategory(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Category
        </Button>
      </div>

      {showAddCategory && (
        <div className="flex gap-2 bg-card p-3 rounded-xl border border-border">
          <Input
            placeholder="Category name (e.g. Appetizers, Main Course)"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            className="rounded-xl font-body"
            onKeyDown={e => e.key === 'Enter' && addCategory()}
          />
          <Button variant="hero" onClick={addCategory}>Add</Button>
          <Button variant="ghost" onClick={() => setShowAddCategory(false)}>Cancel</Button>
        </div>
      )}

      {(!categories || categories.length === 0) && !showAddCategory && (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-body mb-3">No menu categories yet</p>
          <p className="text-sm text-muted-foreground font-body mb-4">Start by adding a category like "Appetizers" or "Main Course", then add items to it.</p>
          <Button variant="hero" onClick={() => setShowAddCategory(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create First Category
          </Button>
        </div>
      )}

      {categories?.map(cat => (
        <div key={cat.id} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">{cat.name}</h3>
            <div className="flex gap-1">
              <Button variant="hero" size="sm" onClick={() => setShowAddItem(cat.id)}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategory(cat.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showAddItem === cat.id && (
            <div className="mb-3 space-y-2 p-3 bg-secondary/30 rounded-lg">
              <Input placeholder="Item name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="rounded-xl font-body" />
              <Input placeholder="Price (TZS)" type="number" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} className="rounded-xl font-body" />
              <Input placeholder="Description (optional)" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="rounded-xl font-body" />
              <div className="flex gap-2">
                <Button variant="hero" size="sm" onClick={() => addItem(cat.id)}>Add Item</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddItem(null)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {cat.items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-body font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-body">TZS {Number(item.price).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.is_available ? 'default' : 'secondary'} className={item.is_available ? 'bg-accent text-accent-foreground' : ''}>
                    {item.is_available ? 'Available' : 'Hidden'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {cat.items.length === 0 && (
              <p className="text-sm text-muted-foreground font-body py-2">No items yet. Click "Add Item" to add dishes to this category.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsPanel({ restaurantId }: { restaurantId: string }) {
  const { data: orders } = useQuery({
    queryKey: ['restaurant-stats', restaurantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId);
      return data || [];
    },
  });

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
  const totalCommission = orders?.reduce((sum, o) => sum + Number(o.commission), 0) || 0;
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

  const stats = [
    { label: 'Total Orders', value: totalOrders, icon: ClipboardList },
    { label: 'Revenue', value: `TZS ${totalRevenue.toLocaleString()}`, icon: BarChart3 },
    { label: 'Net Earnings', value: `TZS ${(totalRevenue - totalCommission).toLocaleString()}`, icon: CheckCircle },
    { label: 'Pending', value: pendingOrders, icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-semibold text-lg">Sales Statistics</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-4 border border-border shadow-warm"
          >
            <stat.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-heading font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground font-body">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
