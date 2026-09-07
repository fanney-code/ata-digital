import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/client';
import { SESSION_COOKIE_NAME, SessionPayload, getAuthenticatedSession } from '@/lib/auth/server-session';

/**
 * GET /api/auth/session
 * Returns the server-authoritative profile for the current session cookie.
 * AuthContext calls this on mount and waits for the response before setting loading=false.
 * The profile includes institution_id from the live profiles table — never from client state.
 */
export async function GET() {
  try {
    const profile = await getAuthenticatedSession();
    if (!profile) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({ user: profile }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

/**
 * POST /api/auth/session
 * Creates the HTTP-only session cookie after login.
 * Verifies identity against the live profiles table before setting the cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // Verify identity against PostgreSQL profiles table
    let profile: any = null;
    const { data: profileWithInst, error: errInst } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, institution_id, created_at, updated_at')
      .eq('id', userId)
      .eq('email', email)
      .maybeSingle();

    if (!errInst && profileWithInst) {
      profile = profileWithInst;
    } else {
      const { data: basicProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, updated_at')
        .eq('id', userId)
        .eq('email', email)
        .maybeSingle();
      if (basicProfile) {
        profile = { ...basicProfile, institution_id: null };
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Invalid profile credentials' }, { status: 401 });
    }

    const payload: SessionPayload = {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
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

    return NextResponse.json({ success: true, user: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Session creation failed' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Session termination failed' }, { status: 500 });
  }
}
