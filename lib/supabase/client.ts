import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gickyuknzgfhlbdxmonj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
