import { Request, Response } from 'express';
// Custom function to extract JWT from cookies
import { JwtType } from '../routes/auth.d';
import { randomUUID } from 'crypto';
import { IJwtPayload } from '@config/passport-config.d';
import { authentication } from './constants';

// Token lifetimes (in seconds)
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

// Build standard claims
const ISSUER = process.env.JWT_ISSUER || 'thechatapp';
const AUDIENCE = process.env.JWT_AUDIENCE || 'thechatapp';

interface CreateTokenOptions {
  sessionId?: string; // reuse sid when rotating tokens within same session
}

interface TokenIssueResult {
  newAccessToken: string;
  newRefreshToken: string;
  sessionId: string;
}

// Helper to build a payload; exp is added by jwt.sign options, but we pre-compute for cookie meta
function buildPayload(params: { sub: string; sessionId: string; ver: number; ttl: number }): Omit<IJwtPayload, 'exp'> & { exp: number } {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    iss: ISSUER,
    aud: AUDIENCE,
    sub: params.sub,
    jti: randomUUID(),
    sid: params.sessionId,
    ver: params.ver,
    iat: nowSeconds,
    // We manually compute exp and DO NOT pass expiresIn to jwt.sign to avoid duplicate claim error
    exp: nowSeconds + params.ttl
  };
}

// Helper to determine and set Access-Control-Allow-Origin dynamically based on allowlist.
// We include a Vary header so that proxies/CDNs do not cache a response for one origin and
// serve it to another.
export function setResponseCorsOrigin(req: Request, res: Response) {
  const rawOrigins = process.env.CLIENT_ORIGINS || '';
  const allowlist = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
  const requestOrigin = req.headers.origin;
  if (requestOrigin && allowlist.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export const createTokenCookies = async (jwt: JwtType, user: { publicId: string; tokenVersion: number }, res: Response, options: CreateTokenOptions = {}): Promise<TokenIssueResult> => {
  // NOTE: We cannot detect the origin here unless we also pass the request.
  // For token issuing routes we call setResponseCorsOrigin in the route handler itself
  // where the Request object is available. Keeping this here for backward compatibility
  // in case some callers still rely on the old behavior (no-op if already set correctly).
  if (!res.getHeader('Access-Control-Allow-Origin')) {
    const firstOrigin = (process.env.CLIENT_ORIGINS || '').split(',')[0]?.trim();
    if (firstOrigin) {
      res.setHeader('Access-Control-Allow-Origin', firstOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const sessionId = options.sessionId || randomUUID();

  // Access token payload (short lived)
  const accessPayload = buildPayload({ sub: user.publicId, sessionId, ver: user.tokenVersion, ttl: ACCESS_TOKEN_TTL });
  // Refresh token payload (long lived, new jti but same sid to link the session)
  const refreshPayload = buildPayload({ sub: user.publicId, sessionId, ver: user.tokenVersion, ttl: REFRESH_TOKEN_TTL });

  const accessToken: string = jwt.sign(accessPayload, process.env.JWT_SECRET as string);
  const refreshToken: string = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET as string);

  const secure = process.env.NODE_ENV === 'production';

  // Set HTTP-only cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_TTL * 1000
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_TTL * 1000
  });
  return { newAccessToken: accessToken, newRefreshToken: refreshToken, sessionId };
};

export const cookieExtractor = (req: Request, tokenName: string) => {
  // req.cookies: { accessToken: string, refreshToken: string }
  let token = null;
  if (req && req.cookies) {
    token = req.cookies[tokenName];
  }
  return token;
};

export const validateLoginInputs = (username: string, password: string): { usernameMessageValidation: string, passwordMessageValidation: string } => {
  const usernameRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  let usernameMessageValidation = "";
  let passwordMessageValidation = "";
  if (!usernameRegEx.test(username)) {
    usernameMessageValidation = authentication.login.errorMessages.username.invalid;
  }
  if (!passwordRegEx.test(password)) {
    passwordMessageValidation = authentication.login.errorMessages.password.invalid;
  }
  return { usernameMessageValidation, passwordMessageValidation };
}

export const validateRegisterInputs = (username: string, password: string, nickname: string): { usernameMessageValidation: string, passwordMessageValidation: string, nicknameMessageValidation: string } => {
  const usernameRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  const nicknameRegEx = /^[a-zA-Z0-9]{3,}$/
  let usernameMessageValidation = "";
  let passwordMessageValidation = "";
  let nicknameMessageValidation = "";
  if (!usernameRegEx.test(username)) {
    usernameMessageValidation = authentication.registration.errorMessages.username.invalid;
  }
  if (!passwordRegEx.test(password)) {
    passwordMessageValidation = authentication.registration.errorMessages.password.invalid;
  }
  if (!nicknameRegEx.test(nickname)) {
    nicknameMessageValidation = authentication.registration.errorMessages.nickname.invalid;
  }
  return { usernameMessageValidation, passwordMessageValidation, nicknameMessageValidation };
}
