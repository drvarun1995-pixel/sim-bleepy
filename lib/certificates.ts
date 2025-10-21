import { createClient } from '@/utils/supabase/client';

export interface Certificate {
  id: string;
  event_id: string;
  user_id: string;
  booking_id?: string;
  template_id: string;
  template_name?: string;
  certificate_data: {
    attendee_name: string;
    event_title: string;
    event_date: string;
    certificate_id: string;
    [key: string]: any;
  };
  certificate_url: string;
  certificate_filename: string;
  sent_via_email: boolean;
  email_sent_at?: string;
  email_error?: string;
  generated_by?: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateWithDetails extends Certificate {
  events?: {
    title: string;
    date: string;
    location_id?: string;
    locations?: {
      name: string;
    };
  };
  users?: {
    name: string;
    email: string;
  };
  generated_by_user?: {
    name: string;
  };
}

export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

export function formatCertificateDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export async function getCertificates(userId?: string): Promise<CertificateWithDetails[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('certificates')
    .select(`
      *,
      events (title, date, location_id, locations (name)),
      users!certificates_user_id_fkey (name, email),
      generated_by_user:users!certificates_generated_by_fkey (name)
    `)
    .order('generated_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
  
  return data || [];
}

export async function getCertificateById(id: string): Promise<CertificateWithDetails | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      events (title, date, location_id, locations (name)),
      users!certificates_user_id_fkey (name, email),
      generated_by_user:users!certificates_generated_by_fkey (name)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching certificate:', error);
    return null;
  }
  
  return data;
}

export async function deleteCertificate(id: string): Promise<boolean> {
  const supabase = createClient();
  
  // First, get the certificate to delete the file from storage
  const certificate = await getCertificateById(id);
  if (!certificate) return false;
  
  // Delete from storage
  const filename = certificate.certificate_filename;
  const eventId = certificate.event_id;
  
  try {
    const { error: storageError } = await supabase.storage
      .from('certificates')
      .remove([`${eventId}/${filename}`]);
    
    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }
  } catch (error) {
    console.error('Storage deletion error:', error);
  }
  
  // Delete from database
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting certificate:', error);
    return false;
  }
  
  return true;
}

export async function downloadCertificate(url: string, filename: string) {
  // If it's a file path (not a full URL), download directly from our API
  if (!url.startsWith('http')) {
    try {
      // Download file directly from our API
      const response = await fetch(`/api/certificates/download?path=${encodeURIComponent(url)}`)
      
      if (response.ok) {
        // Create blob from response
        const blob = await response.blob()
        
        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(downloadUrl);
        return
      } else {
        const errorResult = await response.json()
        throw new Error(errorResult.error || 'Download failed')
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
      throw error
    }
  }
  
  // If it's a Supabase Storage URL (public or signed), download directly
  if (url.includes('supabase.co/storage/v1/object/')) {
    try {
      // For signed URLs, download directly from the URL
      if (url.includes('/object/sign/')) {
        const response = await fetch(url)
        
        if (response.ok) {
          // Create blob from response
          const blob = await response.blob()
          
          // Create download link
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          window.URL.revokeObjectURL(downloadUrl);
          return
        } else {
          throw new Error(`Failed to download from signed URL: ${response.statusText}`)
        }
      }
      
      // For public URLs, extract the path and use our download API
      const pathMatch = url.match(/\/storage\/v1\/object\/public\/certificates\/(.+)$/)
      if (pathMatch) {
        const filePath = pathMatch[1]
        // Download file directly from our API
        const response = await fetch(`/api/certificates/download?path=${encodeURIComponent(filePath)}`)
        
        if (response.ok) {
          // Create blob from response
          const blob = await response.blob()
          
          // Create download link
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          window.URL.revokeObjectURL(downloadUrl);
          return
        } else {
          const errorResult = await response.json()
          throw new Error(errorResult.error || 'Download failed')
        }
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
      throw error
    }
  }
  
  // For other URLs, use direct download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


