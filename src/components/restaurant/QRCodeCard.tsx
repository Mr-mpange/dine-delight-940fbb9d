import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Printer, Download, QrCode, ImagePlus, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface QRCodeCardProps {
  restaurantId?: string;
  restaurantName: string;
  slug: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  backgroundUrl?: string | null;
}

export default function QRCodeCard({ restaurantId, restaurantName, slug, logoUrl, address, phone, backgroundUrl }: QRCodeCardProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publicOrigin = window.location.hostname.includes('id-preview--')
    ? 'https://bite-book-beacon.lovable.app'
    : window.location.origin;
  const menuUrl = `${publicOrigin}/r/${slug}/menu`;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Escape HTML to prevent XSS via restaurant name in <title>
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${escapeHtml(restaurantName)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Georgia', serif; background: white; }
            .card {
              width: 350px; padding: 40px 30px; text-align: center;
              border: 2px solid #E8682A; border-radius: 16px;
            }
            .restaurant-name {
              font-size: 24px; font-weight: bold; color: #1a1a1a; margin-bottom: 4px;
            }
            .tagline { font-size: 12px; color: #888; font-style: italic; margin-bottom: 20px; }
            .qr-container {
              display: inline-block; padding: 16px; background: white;
              border: 1px solid #eee; border-radius: 12px; margin-bottom: 16px;
            }
            .scan-text { font-size: 14px; font-weight: 600; color: #E8682A; margin-bottom: 4px; }
            .url-text { font-size: 10px; color: #aaa; word-break: break-all; }
            .details { margin-top: 16px; font-size: 11px; color: #666; line-height: 1.6; }
            .divider { width: 40px; height: 2px; background: #E8682A; margin: 12px auto; opacity: 0.3; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const handleDownload = () => {
    const svg = printRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.drawImage(img, 0, 0, 400, 400);
      const link = document.createElement('a');
      link.download = `qr-${slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/20 p-6 md:p-8 space-y-5 shadow-warm-lg"
      style={{
        background:
          'radial-gradient(circle at top right, hsl(var(--primary) / 0.18), transparent 60%), linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-gradient-warm opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 w-56 h-56 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center shadow-warm">
          <QrCode className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-xl leading-tight">Table QR Code</h3>
          <p className="text-xs text-muted-foreground font-body">
            Print & place on tables — customers scan to order instantly.
          </p>
        </div>
      </div>

      {/* Printable card */}
      <div ref={printRef} className="relative flex justify-center">
        <div
          className="card"
          style={{
            position: 'relative',
            width: 300,
            padding: '32px 24px',
            textAlign: 'center',
            border: '2px solid hsl(var(--primary))',
            borderRadius: 16,
            background: backgroundUrl
              ? `linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url(${backgroundUrl}) center/cover no-repeat`
              : 'white',
            boxShadow: '0 20px 40px -12px rgba(232, 104, 42, 0.25)',
            overflow: 'hidden',
          }}
        >
          <div
            className="restaurant-name"
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: 4,
              textShadow: backgroundUrl ? '0 1px 2px rgba(255,255,255,0.8)' : undefined,
            }}
          >
            {restaurantName}
          </div>
          <div
            className="tagline"
            style={{
              fontSize: 11,
              color: backgroundUrl ? '#444' : '#888',
              fontStyle: 'italic',
              marginBottom: 16,
              textShadow: backgroundUrl ? '0 1px 2px rgba(255,255,255,0.8)' : undefined,
            }}
          >
            Digital Menu
          </div>
          <div
            className="qr-container"
            style={{
              display: 'inline-block',
              padding: 12,
              background: 'white',
              border: '1px solid #eee',
              borderRadius: 12,
              boxShadow: backgroundUrl ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
            }}
          >
            <QRCodeSVG
              value={menuUrl}
              size={160}
              bgColor="white"
              fgColor="#1a1a1a"
              level="H"
              includeMargin={false}
              imageSettings={
                logoUrl
                  ? { src: logoUrl, height: 36, width: 36, excavate: true }
                  : undefined
              }
            />
          </div>
          <div
            className="scan-text"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#E8682A',
              marginTop: 12,
              marginBottom: 4,
              textShadow: backgroundUrl ? '0 1px 2px rgba(255,255,255,0.8)' : undefined,
            }}
          >
            Scan to View Menu
          </div>
          {(address || phone) && (
            <div className="details" style={{ marginTop: 12 }}>
              <div className="divider" style={{ width: 40, height: 2, background: '#E8682A', margin: '8px auto', opacity: 0.3 }} />
              {address && <div style={{ fontSize: 10, color: backgroundUrl ? '#333' : '#666' }}>{address}</div>}
              {phone && <div style={{ fontSize: 10, color: backgroundUrl ? '#333' : '#666' }}>{phone}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Background upload (admin only) */}
      {restaurantId && (
        <div className="relative flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !restaurantId) return;
              setUploading(true);
              try {
                const ext = file.name.split('.').pop() || 'jpg';
                const path = `${restaurantId}/qr-bg-${Date.now()}.${ext}`;
                const { error: upErr } = await supabase.storage
                  .from('menu-images')
                  .upload(path, file, { upsert: true, contentType: file.type });
                if (upErr) throw upErr;
                const { data: pub } = supabase.storage.from('menu-images').getPublicUrl(path);
                const { error: updErr } = await supabase
                  .from('restaurants')
                  .update({ qr_background_url: pub.publicUrl })
                  .eq('id', restaurantId);
                if (updErr) throw updErr;
                toast({ title: 'Background updated', description: 'Your QR card now uses the new image.' });
                queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
                queryClient.invalidateQueries({ queryKey: ['restaurant'] });
              } catch (err) {
                toast({
                  title: 'Upload failed',
                  description: err instanceof Error ? err.message : 'Try a smaller image.',
                  variant: 'destructive',
                });
              } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-1" />}
              {backgroundUrl ? 'Change Background' : 'Upload Background'}
            </Button>
            {backgroundUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                disabled={uploading}
                onClick={async () => {
                  const { error } = await supabase
                    .from('restaurants')
                    .update({ qr_background_url: null })
                    .eq('id', restaurantId);
                  if (error) {
                    toast({ title: 'Failed', description: error.message, variant: 'destructive' });
                  } else {
                    toast({ title: 'Background removed' });
                    queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
                    queryClient.invalidateQueries({ queryKey: ['restaurant'] });
                  }
                }}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Upload a custom background image for the QR card.
          </p>
        </div>
      )}

      <div className="relative flex gap-2 justify-center">
        <Button variant="hero" size="sm" onClick={handlePrint} className="rounded-full">
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="rounded-full">
          <Download className="w-4 h-4 mr-1" /> Download QR
        </Button>
      </div>
    </div>
  );
}
