import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '@/lib/auth/tokens';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'localhost:3000';
  const proto =
    req.headers.get('x-forwarded-proto') ||
    (host.includes('localhost') ? 'http' : 'https');
  const appOrigin = `${proto}://${host}`;

  if (error || !code) {
    console.error('[Google OAuth] Authorization error or missing code:', error);
    return NextResponse.redirect(`${appOrigin}/?error=google_auth_failed`);
  }

  // Verify CSRF state token
  const storedState = req.cookies.get('google_oauth_state')?.value;
  if (!storedState || storedState !== state) {
    console.warn('[Google OAuth] State token mismatch or expired.');
    return NextResponse.redirect(`${appOrigin}/?error=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
    return NextResponse.redirect(`${appOrigin}/?error=missing_credentials`);
  }

  const redirectUri = `${appOrigin}/api/auth/callback/google`;

  try {
    // 1. Exchange authorization code for Google access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[Google OAuth] Token exchange failed:', tokenData);
      return NextResponse.redirect(`${appOrigin}/?error=token_exchange_failed`);
    }

    // 2. Fetch user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      console.error('[Google OAuth] Userinfo fetch failed');
      return NextResponse.redirect(`${appOrigin}/?error=userinfo_failed`);
    }

    const googleUser = await profileResponse.json();
    const email = googleUser.email?.toLowerCase()?.trim();

    if (!email) {
      return NextResponse.redirect(`${appOrigin}/?error=no_email`);
    }

    const name = googleUser.name || googleUser.given_name || email.split('@')[0];
    const avatar = googleUser.picture || '🦊';

    // 3. Find or create user in database (with graceful fallback if database is currently unreachable)
    let userRecord = null;
    try {
      userRecord = await prisma.user.findUnique({
        where: { email },
      });

      if (!userRecord) {
        // Keep full handle up to 29 characters to fit within schema limits without truncating normal handles
        const baseHandle = `@${email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')}`.slice(0, 29);
        let handle = baseHandle;
        const existingHandle = await prisma.user.findUnique({ where: { handle } });
        if (existingHandle) {
          handle = `${baseHandle.slice(0, 23)}_${Math.random().toString(36).substring(2, 6)}`;
        }

        userRecord = await prisma.user.create({
          data: {
            email,
            name,
            handle,
            emailVerified: new Date(),
            avatar,
            themeColor: '#6366f1',
          },
        });
        console.log(`[Google OAuth] Successfully created new user in DB: ${userRecord.email} (${userRecord.handle}, ID: ${userRecord.id})`);
      } else {
        if (!userRecord.emailVerified) {
          userRecord = await prisma.user.update({
            where: { id: userRecord.id },
            data: { emailVerified: new Date() },
          });
        }
        console.log(`[Google OAuth] Existing user logged in from DB: ${userRecord.email} (${userRecord.handle}, ID: ${userRecord.id})`);
      }
    } catch (dbError: any) {
      console.error('[Google OAuth] Database operation error (could not persist user to DB):', dbError);
      // Construct fallback user so OAuth login succeeds even if DB is temporarily unreachable
      userRecord = {
        id: `google_${googleUser.id || Date.now()}`,
        email,
        name,
        handle: `@${email.split('@')[0]}`.slice(0, 29),
        avatar,
        themeColor: '#6366f1',
      };
    }

    // 4. Generate application JWT tokens
    const accessToken = await generateAccessToken({
      id: userRecord.id,
      email: userRecord.email,
      handle: userRecord.handle,
      name: userRecord.name,
      avatar: userRecord.avatar,
    });

    const refreshToken = await generateRefreshToken({
      id: userRecord.id,
      email: userRecord.email,
      handle: userRecord.handle,
      name: userRecord.name,
      avatar: userRecord.avatar,
    });

    // 5. Set session cookies and redirect to home
    const response = NextResponse.redirect(`${appOrigin}/`);

    // Clean up state cookie
    response.cookies.delete('google_oauth_state');

    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: accessToken,
      httpOnly: false,
      path: '/',
      maxAge: ACCESS_TOKEN_TTL,
      sameSite: 'lax',
      secure: proto === 'https',
    });

    response.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: refreshToken,
      httpOnly: true,
      path: '/',
      maxAge: REFRESH_TOKEN_TTL,
      sameSite: 'lax',
      secure: proto === 'https',
    });

    return response;
  } catch (err: any) {
    console.error('[Google OAuth] Unexpected error in callback:', err);
    return NextResponse.redirect(`${appOrigin}/?error=internal_error`);
  }
}
