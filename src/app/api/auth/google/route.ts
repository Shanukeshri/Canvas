import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID is not configured in environment variables.' },
      { status: 500 }
    );
  }

  // Derive host and protocol (supporting reverse proxies like Render / Vercel)
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'localhost:3000';
  const proto =
    req.headers.get('x-forwarded-proto') ||
    (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/auth/callback/google`;

  // Random state parameter for CSRF mitigation
  const state =
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36);

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', clientId);
  googleUrl.searchParams.set('redirect_uri', redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('access_type', 'offline');
  googleUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(googleUrl.toString());

  // Store state in an HTTP-only cookie for verification in callback
  response.cookies.set({
    name: 'google_oauth_state',
    value: state,
    httpOnly: true,
    path: '/',
    maxAge: 600, // 10 minutes
    sameSite: 'lax',
    secure: proto === 'https',
  });

  return response;
}
