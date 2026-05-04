import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Printer, Download, QrCode } from 'lucide-react';

interface QRCodeCardProps {
  restaurantName: string;
  slug: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
}

export default function QRCodeCard({ restaurantName, slug, logoUrl, address, phone }: QRCodeCardProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const menuUrl = `${window.location.origin}${import.meta.env.BASE_URL}r/${slug}/menu`;

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
            width: 300,
            padding: '32px 24px',
            textAlign: 'center',
            border: '2px solid hsl(var(--primary))',
            borderRadius: 16,
            background: 'white',
            boxShadow: '0 20px 40px -12px rgba(232, 104, 42, 0.25)',
          }}
        >
          <div className="restaurant-name" style={{ fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 }}>
            {restaurantName}
          </div>
          <div className="tagline" style={{ fontSize: 11, color: '#888', fontStyle: 'italic', marginBottom: 16 }}>
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
          <div className="scan-text" style={{ fontSize: 13, fontWeight: 600, color: '#E8682A', marginTop: 12, marginBottom: 4 }}>
            Scan to View Menu
          </div>
          {(address || phone) && (
            <div className="details" style={{ marginTop: 12 }}>
              <div className="divider" style={{ width: 40, height: 2, background: '#E8682A', margin: '8px auto', opacity: 0.3 }} />
              {address && <div style={{ fontSize: 10, color: '#666' }}>{address}</div>}
              {phone && <div style={{ fontSize: 10, color: '#666' }}>{phone}</div>}
            </div>
          )}
        </div>
      </div>

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
