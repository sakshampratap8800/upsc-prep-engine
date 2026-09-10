import { NextRequest, NextResponse } from 'next/server';

const SAKSHAM_TOKEN = process.env.SAKSHAM_SESSION_TOKEN || 'secure_saksham_session_token_v1';
const SHIVANGI_TOKEN = process.env.SHIVANGI_SESSION_TOKEN || 'secure_shivangi_session_token_v1';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 });
    }

    let sessionToken = null;

    if (username === 'saksham' && password === 'saksham') {
      sessionToken = SAKSHAM_TOKEN;
    } else if (username === 'shivangi' && password === 'shivangi') {
      sessionToken = SHIVANGI_TOKEN;
    }

    if (sessionToken) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('upsc_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}
