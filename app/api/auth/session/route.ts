import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase/client';
import { SESSION_COOKIE_NAME, SessionPayload, getAuthenticatedSession } from '@/lib/auth/server-session';
import { UserRole } from '@/lib/types';

// ---------------------------------------------------------------------------
// Authoritative credential store — server-side only, never sent to the client.
// Passwords are SHA-256 hashed. To add a new account update this object.
// ---------------------------------------------------------------------------
interface AuthAccount {
  email: string;
  hash: string;     // sha256(password)
  role: UserRole;
  full_name: string;
  institution_email_hint?: string; // used to look up institution by name
}

const ACCOUNTS: AuthAccount[] = [
  {
    email: 'thomas@ataindia.org',
    hash: 'e62d4aac050d801ca012d4bf47071efa53beccbe78bbc73593a0cdfe6da8d8b7',
    role: 'REGISTRAR',
    full_name: 'Thomas',
  },
  {
    email: 'john@ataindia.org',
    hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    role: 'ADMINISTRATOR',
    full_name: 'John',
  },
  {
    email: 'justin@ataindia.org',
    hash: '3a0b5bf9bc713fe86dab1428659622320b0e1b099ecbe4528358e7b8c5d28fc7',
    role: 'UNIVERSAL',
    full_name: 'Justin',
  },
];

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function findAccount(email: string, password: string): AuthAccount | null {
  const normalised = email.trim().toLowerCase();
  const hash = sha256(password);
  return ACCOUNTS.find(a => a.email === normalised && a.hash === hash) ?? null;
}

async function ensureProfile(account: AuthAccount): Promise<{ id: string; institution_id?: string }> {
  // Check if a profile already exists for this email.
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, institution_id')
    .eq('email', account.email)
    .maybeSingle();

  if (existing?.id) {
    return { id: existing.id, institution_id: existing.institution_id ?? undefined };
  }

  // Create a new profile row so the rest of the app can resolve it.
  const { data: created } = await supabase
    .from('profiles')
    .insert([{
      email: account.email,
      full_name: account.full_name,
      role: account.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select('id, institution_id')
    .single();

  if (created?.id) {
    return { id: created.id, institution_id: created.institution_id ?? undefined };
  }

  // Last resort: generate a stable deterministic ID from the email so the session
  // cookie is self-consistent even when the DB is temporarily unreachable.
  const deterministicId = sha256(account.email).slice(0, 36).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
  return { id: deterministicId };
}

// ---------------------------------------------------------------------------
// GET /api/auth/session  — return the currently logged-in profile
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const profile = await getAuthenticatedSession();
    if (!profile) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({ user: profile }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/session  — validate credentials and issue session cookie
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const account = findAccount(email, password);
    if (!account) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const { id: userId, institution_id } = await ensureProfile(account);

    const payload: SessionPayload = {
      userId,
      email: account.email,
      role: account.role,
      issuedAt: Date.now(),
    };

    const cookieValue = Buffer.from(JSON.stringify(payload)).toString('base64');
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: account.email,
        full_name: account.full_name,
        role: account.role,
        institution_id: institution_id ?? null,
      },
    });
  } catch (err: any) {
    console.error('[POST /api/auth/session]', err.message);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/auth/session  — clear the session cookie (logout)
// ---------------------------------------------------------------------------
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Logout failed' }, { status: 500 });
  }
}
