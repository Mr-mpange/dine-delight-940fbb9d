import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Shield, Store, Users, BarChart3, Plus, LogOut, Trash2, ExternalLink, FileCheck, CheckCircle, XCircle,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

type Tab = 'restaurants' | 'kyc' | 'analytics' | 'users';

export default function SuperAdminDashboard() {
  const { user, signOut, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('restaurants');
  const [showAdd, setShowAdd] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({ name: '', slug: '', description: '', phone: '', address: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user || userRole !== 'super_admin') {
    navigate('/auth');
    return null;
  }

  const tabs = [
    { id: 'restaurants' as Tab, label: 'Restaurants', icon: Store },
    { id: 'kyc' as Tab, label: 'KYC', icon: FileCheck },
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
    { id: 'users' as Tab, label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="font-heading font-bold text-lg">Platform Admin</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>My Restaurant</Button>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-5 h-5" /></Button>
        </div>
      </div>

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
        {activeTab === 'restaurants' && <RestaurantsPanel />}
        {activeTab === 'kyc' && <KycPanel />}
        {activeTab === 'analytics' && <PlatformAnalytics />}
        {activeTab === 'users' && <UsersPanel />}
      </div>
    </div>
  );
}

function RestaurantsPanel() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', phone: '', address: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: restaurants } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: async () => {
      const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const createRestaurant = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    const { error } = await supabase.from('restaurants').insert({
      name: form.name,
      slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      description: form.description || null,
      phone: form.phone || null,
      address: form.address || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setForm({ name: '', slug: '', description: '', phone: '', address: '' });
    setShowAdd(false);
    queryClient.invalidateQueries({ queryKey: ['all-restaurants'] });
    toast({ title: 'Restaurant created!' });
  };

  const deleteRestaurant = async (id: string) => {
    await supabase.from('restaurants').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['all-restaurants'] });
    toast({ title: 'Restaurant deleted' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg">All Restaurants ({restaurants?.length || 0})</h2>
        <Button variant="hero" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Restaurant
        </Button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 border border-border space-y-3">
          <Input placeholder="Restaurant Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl font-body" />
          <Input placeholder="URL Slug (e.g., pizza-palace)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="rounded-xl font-body" />
          <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl font-body" />
          <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl font-body" />
          <Input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="rounded-xl font-body" />
          <div className="flex gap-2">
            <Button variant="hero" onClick={createRestaurant}>Create</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {restaurants?.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-xl p-4 border border-border shadow-warm"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading font-semibold">{r.name}</h3>
              <p className="text-sm text-muted-foreground font-body">{r.address || 'No address'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={r.is_active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-muted-foreground font-body">/{r.slug}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link to={`/r/${r.slug}`} target="_blank"><ExternalLink className="w-4 h-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRestaurant(r.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PlatformAnalytics() {
  const { data: orders } = useQuery({
    queryKey: ['platform-orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*');
      return data || [];
    },
  });

  const { data: restaurants } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: async () => {
      const { data } = await supabase.from('restaurants').select('*');
      return data || [];
    },
  });

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
  const totalCommission = orders?.reduce((sum, o) => sum + Number(o.commission), 0) || 0;

  const stats = [
    { label: 'Total Restaurants', value: restaurants?.length || 0 },
    { label: 'Total Orders', value: orders?.length || 0 },
    { label: 'Platform Revenue', value: `TZS ${totalRevenue.toLocaleString()}` },
    { label: 'Commission Earned', value: `TZS ${totalCommission.toLocaleString()}` },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-semibold text-lg">Platform Analytics</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-4 border border-border shadow-warm"
          >
            <p className="text-2xl font-heading font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground font-body">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function UsersPanel() {
  const { data: roles } = useQuery({
    queryKey: ['user-roles-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('*');
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-semibold text-lg">Users & Roles</h2>
      {roles?.map(role => (
        <div key={role.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
          <span className="font-body text-sm truncate">{role.user_id}</span>
          <Badge className="bg-primary/10 text-primary border-primary/20">{role.role}</Badge>
        </div>
      ))}
      {(!roles || roles.length === 0) && (
        <p className="text-center text-muted-foreground font-body py-8">No users found</p>
      )}
    </div>
  );
}

function KycPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const { data: applications } = useQuery({
    queryKey: ['kyc-applications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('kyc_applications')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const handleApprove = async (app: { id: string; user_id: string; restaurant_name: string }) => {
    try {
      // Update KYC status
      const { error: kycErr } = await supabase
        .from('kyc_applications')
        .update({ status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
        .eq('id', app.id);
      if (kycErr) throw kycErr;

      // Update user role to restaurant_admin
      const { error: roleErr } = await supabase
        .from('user_roles')
        .update({ role: 'restaurant_admin' })
        .eq('user_id', app.user_id);
      if (roleErr) throw roleErr;

      queryClient.invalidateQueries({ queryKey: ['kyc-applications'] });
      toast({ title: `Approved ${app.restaurant_name}!` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleReject = async (app: { id: string; restaurant_name: string }) => {
    try {
      const { error } = await supabase
        .from('kyc_applications')
        .update({
          status: 'rejected',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason[app.id] || 'Application not approved',
        })
        .eq('id', app.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['kyc-applications'] });
      toast({ title: `Rejected ${app.restaurant_name}` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-warm-gold/10 text-warm-gold border-warm-gold/20',
    approved: 'bg-accent/10 text-accent border-accent/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-semibold text-lg">KYC Applications</h2>
      {applications?.map((app, i) => (
        <motion.div
          key={app.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-xl p-4 border border-border shadow-warm space-y-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading font-semibold">{app.restaurant_name}</h3>
              <p className="text-sm text-muted-foreground font-body">{app.phone}</p>
              {app.address && <p className="text-xs text-muted-foreground font-body">{app.address}</p>}
            </div>
            <Badge className={statusColors[app.status] || statusColors.pending}>{app.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-body text-muted-foreground">
            {app.business_license_number && <p>License: {app.business_license_number}</p>}
            {app.tin_number && <p>TIN: {app.tin_number}</p>}
            {app.id_document_url && <a href={app.id_document_url} target="_blank" rel="noreferrer" className="text-primary underline">ID Document</a>}
            {app.business_reg_url && <a href={app.business_reg_url} target="_blank" rel="noreferrer" className="text-primary underline">Business Reg</a>}
          </div>

          <p className="text-xs text-muted-foreground font-body">Applied: {new Date(app.created_at).toLocaleDateString()}</p>

          {app.status === 'pending' && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Textarea
                placeholder="Rejection reason (optional)"
                value={rejectionReason[app.id] || ''}
                onChange={e => setRejectionReason(prev => ({ ...prev, [app.id]: e.target.value }))}
                className="rounded-xl font-body text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button variant="hero" size="sm" className="flex-1" onClick={() => handleApprove(app)}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleReject(app)}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      ))}
      {(!applications || applications.length === 0) && (
        <div className="text-center py-12 text-muted-foreground font-body">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No KYC applications yet
        </div>
      )}
    </div>
  );
}
