import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { AuthLoginSchema } from '@/lib/validation/schemas';
import {
  generateAccessToken,
  generateRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '@/lib/auth/tokens';
import { formatErrorMessage } from '@/lib/utils/error-formatter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AuthLoginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check password
    if (user.passwordHash) {
      const isValid = await bcrypt.compare(parsed.password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password.' },
          { status: 401 }
        );
      }
    } else {
      // User without password (e.g. initial demo user) - allow login if password matches default
      if (parsed.password !== 'zenpass123') {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password.' },
          { status: 401 }
        );
      }
    }

    const accessToken = await generateAccessToken({
      id: user.id,
      email: user.email,
      handle: user.handle,
      name: user.name,
      avatar: user.avatar,
    });

    const refreshToken = await generateRefreshToken({
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
      themeColor: user.themeColor || '#6366f1',
      provider: 'email',
      createdAt: user.createdAt.toLocaleDateString(),
    };

    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken,
      refreshToken,
    });

    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: accessToken,
      httpOnly: false,
      path: '/',
      maxAge: ACCESS_TOKEN_TTL,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: refreshToken,
      httpOnly: false,
      path: '/',
      maxAge: REFRESH_TOKEN_TTL,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: formatErrorMessage(error) },
      { status: 400 }
    );
  }
}
