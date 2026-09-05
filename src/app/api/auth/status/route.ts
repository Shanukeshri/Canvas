import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  evaluateTokens,
  generateAccessToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_TTL,
} from '@/lib/auth/tokens';

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value || null;
    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value || null;

    const evaluation = await evaluateTokens(accessToken, refreshToken);

    if (evaluation.status === 'no_token') {
      return NextResponse.json({
        success: true,
        status: 'no_token',
        user: null,
      });
    }

    if (evaluation.status === 'expired_refresh') {
      // Clear invalid/expired cookies
      const response = NextResponse.json({
        success: true,
        status: 'expired_refresh',
        user: null,
        message: 'Your session has expired. Please sign in again.',
      });
      response.cookies.delete(ACCESS_COOKIE_NAME);
      response.cookies.delete(REFRESH_COOKIE_NAME);
      return response;
    }

    // Refresh needed: expired access token + valid refresh token -> refresh it!
    if (evaluation.status === 'refresh_needed' && evaluation.userId) {
      const user = await prisma.user.findUnique({
        where: { id: evaluation.userId },
        select: {
          id: true,
          name: true,
          email: true,
          handle: true,
          avatar: true,
          themeColor: true,
          preferences: true,
          createdAt: true,
        },
      });

      if (!user) {
        const response = NextResponse.json({
          success: true,
          status: 'no_token',
          user: null,
        });
        response.cookies.delete(ACCESS_COOKIE_NAME);
        response.cookies.delete(REFRESH_COOKIE_NAME);
        return response;
      }

      // Generate new access token
      const newAccessToken = await generateAccessToken({
        id: user.id,
        email: user.email,
        handle: user.handle,
        name: user.name,
        avatar: user.avatar,
      });

      const response = NextResponse.json({
        success: true,
        status: 'refreshed',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          handle: user.handle,
          avatar: user.avatar,
          themeColor: user.themeColor || '#6366f1',
          preferences: user.preferences,
          provider: 'email',
          createdAt: user.createdAt.toLocaleDateString(),
        },
        accessToken: newAccessToken,
      });

      // Set fresh access cookie
      response.cookies.set({
        name: ACCESS_COOKIE_NAME,
        value: newAccessToken,
        httpOnly: false,
        path: '/',
        maxAge: ACCESS_TOKEN_TTL,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return response;
    }

    // Authenticated: valid access token
    if (evaluation.status === 'authenticated' && evaluation.userId) {
      const user = await prisma.user.findUnique({
        where: { id: evaluation.userId },
        select: {
          id: true,
          name: true,
          email: true,
          handle: true,
          avatar: true,
          themeColor: true,
          preferences: true,
          createdAt: true,
        },
      });

      if (!user) {
        const response = NextResponse.json({
          success: true,
          status: 'no_token',
          user: null,
        });
        response.cookies.delete(ACCESS_COOKIE_NAME);
        response.cookies.delete(REFRESH_COOKIE_NAME);
        return response;
      }

      return NextResponse.json({
        success: true,
        status: 'authenticated',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          handle: user.handle,
          avatar: user.avatar,
          themeColor: user.themeColor || '#6366f1',
          preferences: user.preferences,
          provider: 'email',
          createdAt: user.createdAt.toLocaleDateString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: 'no_token',
      user: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
