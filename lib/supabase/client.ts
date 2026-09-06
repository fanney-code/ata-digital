import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gickyuknzgfhlbdxmonj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpY2t5dWtuemdmaGxiZHhtb25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDU4ODMsImV4cCI6MjEwNDAyMTg4M30.yfBNJJrOdrhwh11Ko2CAAYIQxb_OpuiE9ThQhLiqIsQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Generates a temporary signed URL for private cloud object storage document access.
 */
export async function getSignedDocumentUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('student-documents')
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return filePath; // Fallback to raw path if unauthenticated or offline
    }
    return data.signedUrl;
  } catch (err) {
    return filePath;
  }
}
