import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

export interface AuthTokenPayload extends JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
}

interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  isConfigError: boolean;
  payload?: AuthTokenPayload;
  expiresAt?: Date;
  expiresInSeconds?: number;
  errorMessage?: string;
}

interface AccessTokenIssueOptions {
  sub?: string;
  email?: string;
  role?: string;
  expiresIn?: SignOptions['expiresIn'];
}

export interface IssuedAccessToken {
  token: string;
  expiresAt?: Date;
  expiresInSeconds?: number;
}

const getJwtSecret = (secret: string): string => {

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return secret;
};

export const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.trim().split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const validateAccessToken = (
  token: string,
  tokenSecret: string,
): TokenValidationResult => {
  try {
    const secret = getJwtSecret(tokenSecret);
    const payload = jwt.verify(token, secret) as AuthTokenPayload;

    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined;
    const expiresInSeconds = payload.exp
      ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
      : undefined;

    return {
      isValid: true,
      isExpired: false,
      isConfigError: false,
      payload,
      expiresAt,
      expiresInSeconds,
    };
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        isValid: false,
        isExpired: true,
        isConfigError: false,
        expiresAt: error.expiredAt,
        errorMessage: 'Token has expired',
      };
    }

    const isConfigError =
      error instanceof Error && error.message === 'JWT_SECRET is not configured';

    return {
      isValid: false,
      isExpired: false,
      isConfigError,
      errorMessage: isConfigError
        ? 'JWT is not configured on the server'
        : 'Token is invalid',
    };
  }
};

export const createAccessToken = (
  options: AccessTokenIssueOptions,
  tokenSecret: string,
  defaultExpiresIn?: SignOptions['expiresIn'],
): IssuedAccessToken => {
  const secret = getJwtSecret(tokenSecret);
  const expiresIn: SignOptions['expiresIn'] =
    options.expiresIn ?? defaultExpiresIn ?? '1h';

  const payload: AuthTokenPayload = {
    email: options.email,
    role: options.role,
  };

  const token = jwt.sign(payload, secret, {
    subject: options.sub,
    expiresIn,
  });

  const decoded = jwt.decode(token) as JwtPayload | null;
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : undefined;
  const expiresInSeconds = decoded?.exp
    ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000))
    : undefined;

  return {
    token,
    expiresAt,
    expiresInSeconds,
  };
};

interface RefreshTokenIssueOptions {
  email: string;
  role: string;
  sub?: string;
  expiresIn?: SignOptions['expiresIn'];
}

export interface IssuedRefreshToken {
  token: string;
  expiresAt?: Date;
  expiresInSeconds?: number;
}

export const createRefreshToken = (
  options: RefreshTokenIssueOptions,
  tokenSecret: string,
  defaultExpiresIn?: SignOptions['expiresIn'],
): IssuedRefreshToken => {
  const secret = getJwtSecret(tokenSecret);
  const expiresIn: SignOptions['expiresIn'] =
    options.expiresIn ?? defaultExpiresIn ?? '7d';

  const payload: AuthTokenPayload = {
    email: options.email,
    role: options.role,
  };

  const token = jwt.sign(payload, secret, {
    subject: options.sub,
    expiresIn,
  });

  const decoded = jwt.decode(token) as JwtPayload | null;
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : undefined;
  const expiresInSeconds = decoded?.exp
    ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000))
    : undefined;

  return {
    token,
    expiresAt,
    expiresInSeconds,
  };
};
