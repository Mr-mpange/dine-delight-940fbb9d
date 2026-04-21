import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KycDocLinkProps {
  /** Either a storage path (preferred) or a legacy public URL. */
  path: string;
  label: string;
}

/**
 * Renders a link to a KYC document. Generates a short-lived signed URL on click
 * so that documents in the private bucket are never exposed via stable URLs.
 */
export default function KycDocLink({ path, label }: KycDocLinkProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backwards compat: if a legacy full URL was stored, try to extract the path.
      let storagePath = path;
      const legacyMatch = path.match(/\/kyc-documents\/(.+)$/);
      if (legacyMatch) storagePath = legacyMatch[1];

      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(storagePath, 60);
      if (error || !data?.signedUrl) throw error || new Error('Could not generate link');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast({
        title: 'Could not open document',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <a href="#" onClick={handleOpen} className="text-primary underline">
      {loading ? 'Opening…' : label}
    </a>
  );
}
