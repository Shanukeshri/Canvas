import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  evaluateTokens,
} from '../tokens';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'canvas-productivity-secret-key-development-32-chars-long!'
);

describe('Authentication Token Lifecycle', () => {
  const mockUser = {
    id: 'user-test-123',
    email: 'test@canvasfocus.app',
    handle: '@testuser',
    name: 'Test User',
    avatar: '🦊',
  };

  it('1. Generates and validates valid access and refresh tokens', async () => {
    const accessToken = await generateAccessToken(mockUser);
    const refreshToken = await generateRefreshToken(mockUser);

    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    const accessVerify = await verifyToken(accessToken, 'access');
    expect(accessVerify.valid).toBe(true);
    expect(accessVerify.expired).toBe(false);
    expect(accessVerify.payload?.sub).toBe(mockUser.id);
    expect(accessVerify.payload?.email).toBe(mockUser.email);

    const refreshVerify = await verifyToken(refreshToken, 'refresh');
    expect(refreshVerify.valid).toBe(true);
    expect(refreshVerify.expired).toBe(false);
    expect(refreshVerify.payload?.sub).toBe(mockUser.id);
  });

  it('2. Flow Rule: No token -> status is no_token', async () => {
    const result = await evaluateTokens(null, null);
    expect(result.status).toBe('no_token');
    expect(result.userId).toBeNull();
  });

  it('3. Flow Rule: Expired refresh token -> status is expired_refresh', async () => {
    // Generate an already expired refresh token (1 second in past)
    const expiredRefreshToken = await new SignJWT({
      sub: mockUser.id,
      email: mockUser.email,
      handle: mockUser.handle,
      type: 'refresh',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(JWT_SECRET);

    const result = await evaluateTokens(null, expiredRefreshToken);
    expect(result.status).toBe('expired_refresh');
    expect(result.userId).toBeNull();
  });

  it('4. Flow Rule: Expired access token and valid refresh token -> status is refresh_needed', async () => {
    const validRefreshToken = await generateRefreshToken(mockUser);

    // Expired access token
    const expiredAccessToken = await new SignJWT({
      sub: mockUser.id,
      email: mockUser.email,
      handle: mockUser.handle,
      type: 'access',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(JWT_SECRET);

    const result = await evaluateTokens(expiredAccessToken, validRefreshToken);
    expect(result.status).toBe('refresh_needed');
    expect(result.userId).toBe(mockUser.id);
    expect(result.payload?.email).toBe(mockUser.email);
  });

  it('5. Flow Rule: Valid access token and valid refresh token -> status is authenticated', async () => {
    const accessToken = await generateAccessToken(mockUser);
    const refreshToken = await generateRefreshToken(mockUser);

    const result = await evaluateTokens(accessToken, refreshToken);
    expect(result.status).toBe('authenticated');
    expect(result.userId).toBe(mockUser.id);
    expect(result.payload?.email).toBe(mockUser.email);
  });
});
