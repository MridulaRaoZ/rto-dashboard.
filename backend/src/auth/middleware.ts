import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { config } from '../config.js';

const JWKS = createRemoteJWKSet(
  new URL(`https://login.microsoftonline.com/${config.tenantId}/discovery/v2.0/keys`)
);

export interface AuthenticatedRequest extends Request {
  user: {
    oid: string;
    email: string;
    name: string;
    roles: string[];
  };
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Bearer token' });
    return;
  }

  const token = header.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://login.microsoftonline.com/${config.tenantId}/v2.0`,
      audience: `api://${config.clientId}`,
    });

    (req as AuthenticatedRequest).user = extractClaims(payload);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function extractClaims(payload: JWTPayload) {
  const p = payload as Record<string, unknown>;
  return {
    oid: (p['oid'] as string) ?? '',
    email: (p['preferred_username'] as string) ?? (p['email'] as string) ?? '',
    name: (p['name'] as string) ?? '',
    roles: (p['roles'] as string[]) ?? [],
  };
}
