import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { AuthRegisterSchema } from '@/lib/validation/schemas';
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
    const parsed = AuthRegisterSchema.parse(body);

    const email = parsed.email.toLowerCase().trim();
    let handle = parsed.handle?.trim();
    if (!handle) {
      handle = `@${parsed.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
    if (!handle.startsWith('@')) {
      handle = `@${handle}`;
    }

    // Check if email exists
    const existingEmail = await prisma.user.findFirst({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email already exists.',
        },
        { status: 400 }
      );
    }

    // Check if handle exists
    let finalHandle = handle;
    const existingHandle = await prisma.user.findFirst({
      where: { handle: finalHandle },
    });
    if (existingHandle) {
      if (!parsed.handle || parsed.handle === handle) {
        // Auto-disambiguate auto-generated handle
        finalHandle = `${finalHandle}_${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'This handle is already taken. Please choose another.',
          },
          { status: 400 }
        );
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsed.password, salt);

    const user = await prisma.user.create({
      data: {
        name: parsed.name.trim(),
        email,
        handle: finalHandle,
        passwordHash,
        avatar: parsed.avatar || '🦊',
        themeColor: '#6366f1',
      },
    });

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
      preferences: user.preferences,
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
