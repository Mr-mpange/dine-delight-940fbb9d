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

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${restaurantName}</title>
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
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <QrCode className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-semibold text-lg">Table QR Code</h3>
      </div>
      <p className="text-sm text-muted-foreground font-body">
        Print this QR code and place it on tables. Customers scan to view your digital menu instantly.
      </p>

      {/* Printable card */}
      <div ref={printRef} className="flex justify-center">
        <div className="card" style={{
          width: 300, padding: '32px 24px', textAlign: 'center',
          border: '2px solid hsl(var(--primary))', borderRadius: 16, background: 'white'
        }}>
          <div className="restaurant-name" style={{ fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 }}>
            {restaurantName}
          </div>
          <div className="tagline" style={{ fontSize: 11, color: '#888', fontStyle: 'italic', marginBottom: 16 }}>
            Digital Menu
          </div>
          <div className="qr-container" style={{
            display: 'inline-block', padding: 12, background: 'white',
            border: '1px solid #eee', borderRadius: 12
          }}>
            <QRCodeSVG
              value={menuUrl}
              size={160}
              bgColor="white"
              fgColor="#1a1a1a"
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="scan-text" style={{ fontSize: 13, fontWeight: 600, color: '#E8682A', marginTop: 12, marginBottom: 4 }}>
            Scan to View Menu
          </div>
          <div className="url-text" style={{ fontSize: 9, color: '#aaa', wordBreak: 'break-all' as const }}>
            {menuUrl}
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

      <div className="flex gap-2 justify-center">
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
