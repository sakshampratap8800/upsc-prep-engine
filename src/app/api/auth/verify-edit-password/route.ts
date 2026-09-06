import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, generateAuthToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Incorrect admin password' }, { status: 401 });
    }

    const token = generateAuthToken();
    const response = NextResponse.json({ success: true, token });

    // Also set a secure HTTP-only cookie for browser sessions
    response.cookies.set('upsc_admin_token', token, {
      path: '/',
      httpOnly: false, // Accessible to client if needed, but sent automatically with requests
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
