import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Upload, CheckCircle, Clock, XCircle, LogOut, ClipboardCheck, Store, ShieldCheck } from 'lucide-react';

type KycStatus = 'pending' | 'approved' | 'rejected';

const maxFileSize = 8 * 1024 * 1024;

function validateDocument(file: File) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowed.includes(file.type)) return 'Please upload PDF, JPG, or PNG files only.';
  if (file.size > maxFileSize) return 'Each document must be under 8 MB.';
  return null;
}

export default function KycApplicationPage() {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [form, setForm] = useState({
    restaurant_name: '',
    phone: '',
    address: '',
    business_license_number: '',
    tin_number: '',
  });
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [bizDoc, setBizDoc] = useState<File | null>(null);

  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ['my-kyc-history', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('kyc_applications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      return data || [];
    },
    enabled: !!user,
  });

  const latestApp = applications?.[0] ?? null;
  const shouldShowForm = !latestApp || (latestApp.status === 'rejected' && showResubmitForm);

  useEffect(() => {
    if (latestApp?.status === 'rejected') {
      setForm({
        restaurant_name: latestApp.restaurant_name || '',
        phone: latestApp.phone || '',
        address: latestApp.address || '',
        business_license_number: latestApp.business_license_number || '',
        tin_number: latestApp.tin_number || '',
      });
    }
  }, [latestApp]);

  const timeline = useMemo(() => {
    const status = latestApp?.status as KycStatus | undefined;
    return [
      {
        label: 'Submitted',
        desc: latestApp ? `Application received on ${new Date(latestApp.created_at).toLocaleDateString()}` : 'Fill and submit the form below.',
        done: !!latestApp,
        active: !latestApp,
        icon: ClipboardCheck,
      },
      {
        label: 'Under review',
        desc: status === 'pending' ? 'Our team is checking your business details and documents.' : 'Review starts after submission.',
        done: status === 'approved' || status === 'rejected',
        active: status === 'pending',
        icon: Clock,
      },
      {
        label: 'Approved',
        desc: status === 'approved' ? 'You can now access menu, orders, QR code, stats, and settings.' : 'Approval unlocks restaurant-admin pages.',
        done: status === 'approved',
        active: status === 'approved',
        icon: CheckCircle,
      },
      {
        label: 'Rejected',
        desc: status === 'rejected' ? (latestApp?.rejection_reason || 'Update your details and resubmit.') : 'Only shown if corrections are needed.',
        done: status === 'rejected',
        active: status === 'rejected',
        icon: XCircle,
      },
    ];
  }, [latestApp]);

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

  const uploadFile = async (file: File, folder: string) => {
    const validationError = validateDocument(file);
    if (validationError) throw new Error(validationError);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kyc-documents').upload(path, file);
    if (error) throw error;
    // Store only the storage path — admins generate signed URLs on demand.
    return path;
  };

  const handleSubmit = async () => {
    if (!form.restaurant_name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast({ title: 'Missing details', description: 'Restaurant name, phone, and address are required.', variant: 'destructive' });
      return;
    }
    if (!form.business_license_number.trim() || !form.tin_number.trim()) {
      toast({ title: 'Missing business details', description: 'Business license number and TIN number are required.', variant: 'destructive' });
      return;
    }
    if (!idDoc || !bizDoc) {
      toast({ title: 'Documents required', description: 'Upload an ID document and business registration certificate.', variant: 'destructive' });
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
        restaurant_name: form.restaurant_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        business_license_number: form.business_license_number.trim(),
        tin_number: form.tin_number.trim(),
        id_document_url,
        business_reg_url,
      });

      if (error) throw error;
      toast({ title: showResubmitForm ? 'Application resubmitted!' : 'Application submitted!', description: 'We will review your application shortly.' });
      setIdDoc(null);
      setBizDoc(null);
      setShowResubmitForm(false);
      await refetch();
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
          <h1 className="text-xl font-heading font-semibold">Restaurant KYC</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-1" /> Sign Out
        </Button>
      </div>

      <div className="p-4 space-y-5 max-w-3xl mx-auto">
        <section className="bg-card rounded-xl border border-border p-5 shadow-warm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-heading font-bold">KYC Application Status</h2>
              <p className="text-muted-foreground font-body text-sm mt-1">
                Restaurant-admin pages stay locked until your KYC is approved.
              </p>
            </div>
            {latestApp && <Badge className="capitalize">{latestApp.status}</Badge>}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {timeline.map((step) => (
              <div key={step.label} className={`rounded-xl border p-3 ${step.active ? 'border-primary bg-primary/5' : step.done ? 'border-accent/30 bg-accent/5' : 'border-border bg-background'}`}>
                <step.icon className={`w-5 h-5 mb-2 ${step.active ? 'text-primary' : step.done ? 'text-accent' : 'text-muted-foreground'}`} />
                <p className="font-body font-semibold text-sm">{step.label}</p>
                <p className="text-xs text-muted-foreground font-body mt-1">{step.desc}</p>
              </div>
            ))}
          </div>

          {latestApp?.status === 'pending' && (
            <div className="rounded-xl bg-secondary/40 border border-border p-4 flex gap-3">
              <Clock className="w-5 h-5 text-warm-gold mt-0.5" />
              <div>
                <p className="font-body font-semibold">Next step: wait for review</p>
                <p className="text-sm text-muted-foreground font-body">You cannot access menu, orders, QR code, stats, or settings until approval.</p>
              </div>
            </div>
          )}

          {latestApp?.status === 'approved' && (
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 flex items-center justify-between gap-3">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="font-body font-semibold">Approved — dashboard unlocked</p>
                  <p className="text-sm text-muted-foreground font-body">You can now manage your restaurant.</p>
                </div>
              </div>
              <Button variant="hero" onClick={() => navigate('/admin')}>Go to Dashboard</Button>
            </div>
          )}

          {latestApp?.status === 'rejected' && !showResubmitForm && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 space-y-3">
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-body font-semibold">Corrections needed</p>
                  <p className="text-sm text-muted-foreground font-body">{latestApp.rejection_reason || 'Please update your details and upload fresh documents.'}</p>
                </div>
              </div>
              <Button variant="hero" onClick={() => setShowResubmitForm(true)}>Resubmit KYC</Button>
            </div>
          )}
        </section>

        {shouldShowForm && (
          <section className="bg-card rounded-xl border border-border p-5 shadow-warm space-y-5">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-xl">{showResubmitForm ? 'Resubmit Application' : 'Complete KYC Application'}</h2>
            </div>
            <p className="text-muted-foreground font-body text-sm">
              Submit accurate restaurant, business, and document details for review.
            </p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h3 className="font-heading font-semibold">Restaurant Info</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Restaurant Name *" value={form.restaurant_name} onChange={e => setForm({ ...form, restaurant_name: e.target.value })} className="rounded-xl h-12 font-body" />
                <Input placeholder="Phone Number *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl h-12 font-body" />
              </div>
              <Textarea placeholder="Full Restaurant Address *" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="rounded-xl font-body" rows={3} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
              <h3 className="font-heading font-semibold">Business Details</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Business License Number *" value={form.business_license_number} onChange={e => setForm({ ...form, business_license_number: e.target.value })} className="rounded-xl h-12 font-body" />
                <Input placeholder="TIN Number *" value={form.tin_number} onChange={e => setForm({ ...form, tin_number: e.target.value })} className="rounded-xl h-12 font-body" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
              <h3 className="font-heading font-semibold">Documents</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/30 transition-all">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium truncate">{idDoc ? idDoc.name : 'ID Document *'}</p>
                    <p className="text-xs text-muted-foreground font-body">Passport/National ID — PDF, JPG or PNG</p>
                  </div>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setIdDoc(e.target.files?.[0] || null)} />
                </label>
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/30 transition-all">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium truncate">{bizDoc ? bizDoc.name : 'Business Registration Certificate *'}</p>
                    <p className="text-xs text-muted-foreground font-body">Updated proof — PDF, JPG or PNG</p>
                  </div>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setBizDoc(e.target.files?.[0] || null)} />
                </label>
              </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="hero" size="lg" className="flex-1 rounded-xl py-6 text-lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : showResubmitForm ? 'Submit Updated KYC' : 'Submit Application'}
              </Button>
              {showResubmitForm && (
                <Button variant="ghost" size="lg" className="rounded-xl" onClick={() => setShowResubmitForm(false)} disabled={submitting}>Cancel</Button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
