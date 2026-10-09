import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

import config from '../../config/config';

export const ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 60;

const TOKEN_ISSUER = 'draangela-back';
const TOKEN_AUDIENCE = 'landing-page';

export interface AuthenticatedUser {
    id: string;
    username: string;
}

function getJwtSecret(): string {
    const secret = config.landingPageConfig.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
        throw new Error('JWT_SECRET must be configured with at least 32 bytes.');
    }
    return secret;
}

export function createAccessToken(user: AuthenticatedUser): string {
    const options: SignOptions = {
        algorithm: 'HS256',
        expiresIn: ACCESS_TOKEN_LIFETIME_SECONDS,
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
        subject: user.id,
    };
    return jwt.sign({ username: user.username }, getJwtSecret(), options);
}

export function verifyAccessToken(token: string): AuthenticatedUser | undefined {
    let payload: string | JwtPayload;
    try {
        payload = jwt.verify(token, getJwtSecret(), {
            algorithms: ['HS256'],
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE,
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return undefined;
        }
        throw error;
    }

    if (typeof payload === 'string'
        || typeof payload.sub !== 'string'
        || typeof payload.username !== 'string') {
        return undefined;
    }

    return { id: payload.sub, username: payload.username };
}
