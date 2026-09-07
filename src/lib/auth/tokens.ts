import { SignJWT, jwtVerify, errors } from 'jose';

const JWT_SECRET_STRING =
  process.env.AUTH_SECRET || 'canvas-productivity-secret-key-development-32-chars-long!';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface TokenPayload {
  sub: string;
  email: string;
  handle: string;
  name?: string;
  avatar?: string;
  type: 'access' | 'refresh';
}

export const ACCESS_COOKIE_NAME = 'canvas_access_token';
export const REFRESH_COOKIE_NAME = 'canvas_refresh_token';

// Backward compatibility aliases
export const ZEN_ACCESS_COOKIE_NAME = 'zen_access_token';
export const ZEN_REFRESH_COOKIE_NAME = 'zen_refresh_token';

// Access token: 15 minutes
export const ACCESS_TOKEN_TTL = 15 * 60; // 15 mins in seconds
// Refresh token: 7 days
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Generates an Access Token (15m expiry)
 */
export async function generateAccessToken(user: {
  id: string;
  email: string;
  handle: string;
  name?: string;
  avatar?: string;
}): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    handle: user.handle,
    name: user.name,
    avatar: user.avatar,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

/**
 * Generates a Refresh Token (7d expiry)
 */
export async function generateRefreshToken(user: {
  id: string;
  email: string;
  handle: string;
  name?: string;
  avatar?: string;
}): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    handle: user.handle,
    name: user.name,
    avatar: user.avatar,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export interface VerifyResult {
  valid: boolean;
  expired: boolean;
  payload: TokenPayload | null;
  error?: string;
}

/**
 * Verifies an access or refresh token, explicitly differentiating between expired vs invalid
 */
export async function verifyToken(
  token: string,
  expectedType: 'access' | 'refresh'
): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const tokenPayload = payload as unknown as TokenPayload;

    if (tokenPayload.type !== expectedType) {
      return {
        valid: false,
        expired: false,
        payload: null,
        error: `Expected token type ${expectedType}, received ${tokenPayload.type}`,
      };
    }

    return {
      valid: true,
      expired: false,
      payload: tokenPayload,
    };
  } catch (err: any) {
    if (err instanceof errors.JWTExpired || err.code === 'ERR_JWT_EXPIRED') {
      return {
        valid: false,
        expired: true,
        payload: null,
        error: 'Token has expired',
      };
    }
    return {
      valid: false,
      expired: false,
      payload: null,
      error: err.message || 'Invalid token',
    };
  }
}

export type AuthEvaluationStatus =
  | 'no_token'
  | 'expired_refresh'
  | 'refresh_needed'
  | 'authenticated';

export interface AuthEvaluationResult {
  status: AuthEvaluationStatus;
  userId: string | null;
  payload: TokenPayload | null;
  message?: string;
}

/**
 * Evaluates the tokens per the exact product requirement:
 * 1. If no token (neither access nor refresh) -> 'no_token'
 * 2. If expired refresh token -> 'expired_refresh'
 * 3. If expired access token AND valid refresh token -> 'refresh_needed'
 * 4. If valid access token -> 'authenticated'
 */
export async function evaluateTokens(
  accessToken?: string | null,
  refreshToken?: string | null
): Promise<AuthEvaluationResult> {
  // Case 1: No token at all
  if (!accessToken && !refreshToken) {
    return {
      status: 'no_token',
      userId: null,
      payload: null,
      message: 'No credentials found.',
    };
  }

  // If refresh token exists, check it first
  if (refreshToken) {
    const refreshCheck = await verifyToken(refreshToken, 'refresh');

    // Case 2: Refresh token is expired
    if (refreshCheck.expired) {
      return {
        status: 'expired_refresh',
        userId: null,
        payload: null,
        message: 'Your session has expired. Please sign in again.',
      };
    }

    // Refresh token is completely corrupted/invalid and no access token
    if (!refreshCheck.valid && !accessToken) {
      return {
        status: 'no_token',
        userId: null,
        payload: null,
        message: 'Invalid session.',
      };
    }

    // Refresh token is valid! Now examine access token
    if (refreshCheck.valid) {
      if (!accessToken) {
        // Access token missing but refresh token is valid -> refresh it!
        return {
          status: 'refresh_needed',
          userId: refreshCheck.payload!.sub,
          payload: refreshCheck.payload,
          message: 'Access token missing, refresh token valid.',
        };
      }

      const accessCheck = await verifyToken(accessToken, 'access');

      // Case 3: Expired access token and valid refresh token -> refresh it!
      if (accessCheck.expired || !accessCheck.valid) {
        return {
          status: 'refresh_needed',
          userId: refreshCheck.payload!.sub,
          payload: refreshCheck.payload,
          message: 'Access token expired, refresh token valid.',
        };
      }

      // Case 4: Both valid -> authenticated!
      return {
        status: 'authenticated',
        userId: accessCheck.payload!.sub,
        payload: accessCheck.payload,
        message: 'Authenticated.',
      };
    }
  }

  // If only access token was passed (no refresh token)
  if (accessToken) {
    const accessCheck = await verifyToken(accessToken, 'access');
    if (accessCheck.valid) {
      return {
        status: 'authenticated',
        userId: accessCheck.payload!.sub,
        payload: accessCheck.payload,
        message: 'Authenticated.',
      };
    }
  }

  return {
    status: 'no_token',
    userId: null,
    payload: null,
    message: 'No valid tokens found.',
  };
}
