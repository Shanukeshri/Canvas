import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ZEN_ACCESS_COOKIE_NAME,
  ZEN_REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '@/lib/auth/tokens';

export async function POST(req: NextRequest) {
  try {
    let refreshToken =
      req.cookies.get(REFRESH_COOKIE_NAME)?.value ||
      req.cookies.get(ZEN_REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      const contentType = req.headers.get('content-type');
      const contentLength = req.headers.get('content-length');
      if (contentType?.includes('application/json') && contentLength && contentLength !== '0') {
        try {
          const body = await req.json();
          refreshToken = body.refreshToken;
        } catch {
          // ignore empty or invalid body
        }
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token provided.' },
        { status: 401 }
      );
    }

    const verification = await verifyToken(refreshToken, 'refresh');

    if (verification.expired) {
      const response = NextResponse.json(
        { success: false, expired: true, error: 'Refresh token expired. Please log in again.' },
        { status: 401 }
      );
      response.cookies.delete(ACCESS_COOKIE_NAME);
      response.cookies.delete(REFRESH_COOKIE_NAME);
      response.cookies.delete(ZEN_ACCESS_COOKIE_NAME);
      response.cookies.delete(ZEN_REFRESH_COOKIE_NAME);
      return response;
    }

    if (!verification.valid || !verification.payload) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid refresh token.' },
        { status: 401 }
      );
      response.cookies.delete(ACCESS_COOKIE_NAME);
      response.cookies.delete(REFRESH_COOKIE_NAME);
      response.cookies.delete(ZEN_ACCESS_COOKIE_NAME);
      response.cookies.delete(ZEN_REFRESH_COOKIE_NAME);
      return response;
    }

    const userId = verification.payload.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        handle: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User no longer exists.' },
        { status: 404 }
      );
    }

    const newAccessToken = await generateAccessToken({
      id: user.id,
      email: user.email,
      handle: user.handle,
      name: user.name,
      avatar: user.avatar,
    });

    const newRefreshToken = await generateRefreshToken({
      id: user.id,
      email: user.email,
      handle: user.handle,
      name: user.name,
      avatar: user.avatar,
    });

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatar,
      provider: 'email',
      createdAt: user.createdAt.toLocaleDateString(),
    };

    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: newAccessToken,
      httpOnly: false,
      path: '/',
      maxAge: ACCESS_TOKEN_TTL,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: newRefreshToken,
      httpOnly: false,
      path: '/',
      maxAge: REFRESH_TOKEN_TTL,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Token refresh failed' },
      { status: 500 }
    );
  }
}
