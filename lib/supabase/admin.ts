import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gickyuknzgfhlbdxmonj.supabase.co';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Admin Supabase client — uses the service role key which bypasses RLS.
 * ONLY use server-side (API routes, server components).
 * Never expose this client or its key to the browser.
 */
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export const STORAGE_BUCKET = 'student-documents';

/**
 * Ensures the student-documents storage bucket exists.
 * Creates it as a private bucket if it doesn't exist.
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set.
 */
export async function ensureStorageBucket(): Promise<{ ok: boolean; message: string }> {
  if (!supabaseAdmin) {
    return {
      ok: false,
      message: 'SUPABASE_SERVICE_ROLE_KEY is not set. Cannot create storage bucket.',
    };
  }

  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    return { ok: false, message: `Failed to list buckets: ${listError.message}` };
  }

  const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);
  if (exists) {
    return { ok: true, message: `Bucket '${STORAGE_BUCKET}' already exists.` };
  }

  // Create the bucket
  const { error: createError } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
    public: false,
    fileSizeLimit: 52428800, // 50 MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
    ],
  });

  if (createError) {
    return { ok: false, message: `Failed to create bucket: ${createError.message}` };
  }

  return { ok: true, message: `Bucket '${STORAGE_BUCKET}' created successfully.` };
}
