import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/server-session';
import { fetchChatMessages, addChatMessage, fetchChatUsers } from '@/lib/api/supabase-service';
import { UserRole } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'users') {
      const users = await fetchChatUsers(session.role as UserRole);
      return NextResponse.json({ users });
    }

    const student_id = searchParams.get('student_id') || undefined;
    const target_user_id = searchParams.get('target_user_id') || undefined;

    const messages = await fetchChatMessages({
      student_id,
      target_user_id,
      current_user_id: session.id,
      recipient_role: session.role as UserRole,
    });

    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, recipient_role, recipient_id, student_id } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const senderRole = session.role as UserRole;
    const targetRole = recipient_role as UserRole;

    // Role-based target restriction matrix checks:
    if (senderRole === 'REGISTRAR' && targetRole !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: '403 Forbidden: Registrars can only send messages/comments to Administrators.' },
        { status: 403 }
      );
    }

    if (senderRole === 'ADMINISTRATOR' && targetRole !== 'REGISTRAR' && targetRole !== 'UNIVERSAL') {
      return NextResponse.json(
        { error: '403 Forbidden: Administrators can only send messages to Registrars or Universal users.' },
        { status: 403 }
      );
    }

    if (senderRole === 'UNIVERSAL' && targetRole !== 'REGISTRAR' && targetRole !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: '403 Forbidden: Universal users can only send messages to Registrars or Administrators.' },
        { status: 403 }
      );
    }

    // Registrars cannot communicate with other Registrars; broadcasting to all Registrars is strictly prohibited.
    if (targetRole === 'REGISTRAR' && (!recipient_id || recipient_id === 'ALL')) {
      return NextResponse.json(
        { error: '403 Forbidden: Registrar broadcast channels are disabled. You must select a specific Registrar recipient.' },
        { status: 403 }
      );
    }

    const newMessage = await addChatMessage({
      sender_id: session.id,
      sender_name: session.full_name || session.email || 'System User',
      sender_role: senderRole,
      recipient_role: targetRole,
      recipient_id: recipient_id || undefined,
      student_id: student_id || undefined,
      message: message.trim(),
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to post message' }, { status: 500 });
  }
}
