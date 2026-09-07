import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ZEN_ACCESS_COOKIE_NAME,
  ZEN_REFRESH_COOKIE_NAME,
} from '@/lib/auth/tokens';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.delete(ACCESS_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  response.cookies.delete(ZEN_ACCESS_COOKIE_NAME);
  response.cookies.delete(ZEN_REFRESH_COOKIE_NAME);
  return response;
}
