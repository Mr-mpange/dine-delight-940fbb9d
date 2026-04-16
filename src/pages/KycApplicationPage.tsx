import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Upload, CheckCircle, Clock, XCircle, LogOut } from 'lucide-react';

export default function KycApplicationPage() {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    restaurant_name: '',
    phone: '',
    address: '',
    business_license_number: '',
    tin_number: '',
  });
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [bizDoc, setBizDoc] = useState<File | null>(null);

  const { data: existingApp, isLoading } = useQuery({
    queryKey: ['my-kyc', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('kyc_applications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show status if already applied
  if (existingApp) {
    const statusConfig = {
      pending: { icon: Clock, color: 'text-warm-gold', title: 'Application Under Review', desc: 'Your KYC application is being reviewed by our team. We\'ll notify you once approved.' },
      approved: { icon: CheckCircle, color: 'text-accent', title: 'Application Approved!', desc: 'Your account has been approved. You can now create and manage your restaurant.' },
      rejected: { icon: XCircle, color: 'text-destructive', title: 'Application Rejected', desc: existingApp.rejection_reason || 'Your application was not approved. Please contact support.' },
    };
    const config = statusConfig[existingApp.status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
          <Icon className={`w-20 h-20 ${config.color}`} />
        </motion.div>
        <h2 className="text-2xl font-heading font-bold mt-6">{config.title}</h2>
        <p className="text-muted-foreground font-body mt-2 max-w-md">{config.desc}</p>
        <p className="text-sm text-muted-foreground font-body mt-4">Restaurant: {existingApp.restaurant_name}</p>
        {existingApp.status === 'approved' && (
          <Button variant="hero" className="mt-6" onClick={() => navigate('/admin')}>
            Go to Dashboard
          </Button>
        )}
        {existingApp.status === 'rejected' && (
          <Button variant="hero" className="mt-6" onClick={() => navigate('/apply')}>
            Apply Again
          </Button>
        )}
        <Button variant="ghost" className="mt-3" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    );
  }

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kyc-documents').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!form.restaurant_name.trim() || !form.phone.trim()) {
      toast({ title: 'Please fill restaurant name and phone', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let id_document_url = null;
      let business_reg_url = null;

      if (idDoc) id_document_url = await uploadFile(idDoc, 'id');
      if (bizDoc) business_reg_url = await uploadFile(bizDoc, 'biz');

      const { error } = await supabase.from('kyc_applications').insert({
        user_id: user.id,
        restaurant_name: form.restaurant_name,
        phone: form.phone,
        address: form.address || null,
        business_license_number: form.business_license_number || null,
        tin_number: form.tin_number || null,
        id_document_url,
        business_reg_url,
      });

      if (error) throw error;
      toast({ title: 'Application submitted!', description: 'We will review your application shortly.' });
      window.location.reload();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-heading font-semibold">Restaurant Application</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-1" /> Sign Out
        </Button>
      </div>

      <div className="p-4 space-y-5 max-w-md mx-auto">
        <p className="text-muted-foreground font-body text-sm">
          Fill in your details to apply as a restaurant admin. Our team will review and approve your application.
        </p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h3 className="font-heading font-semibold">Restaurant Info</h3>
          <Input placeholder="Restaurant Name *" value={form.restaurant_name} onChange={e => setForm({ ...form, restaurant_name: e.target.value })} className="rounded-xl h-12 font-body" />
          <Input placeholder="Phone Number *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl h-12 font-body" />
          <Input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="rounded-xl h-12 font-body" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <h3 className="font-heading font-semibold">Business Details</h3>
          <Input placeholder="Business License Number" value={form.business_license_number} onChange={e => setForm({ ...form, business_license_number: e.target.value })} className="rounded-xl h-12 font-body" />
          <Input placeholder="TIN Number" value={form.tin_number} onChange={e => setForm({ ...form, tin_number: e.target.value })} className="rounded-xl h-12 font-body" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          <h3 className="font-heading font-semibold">Documents</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/30 transition-all">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-body text-sm font-medium">{idDoc ? idDoc.name : 'ID Document (Passport/National ID)'}</p>
                <p className="text-xs text-muted-foreground font-body">PDF, JPG or PNG</p>
              </div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setIdDoc(e.target.files?.[0] || null)} />
            </label>
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/30 transition-all">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-body text-sm font-medium">{bizDoc ? bizDoc.name : 'Business Registration Certificate'}</p>
                <p className="text-xs text-muted-foreground font-body">PDF, JPG or PNG</p>
              </div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setBizDoc(e.target.files?.[0] || null)} />
            </label>
          </div>
        </motion.div>

        <Button variant="hero" size="lg" className="w-full rounded-xl py-6 text-lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </div>
  );
}
