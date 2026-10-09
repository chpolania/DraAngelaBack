import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

import { verifyAccessToken } from '../../infrastructure/auth/bearer-token';
import { CustomError } from '../../utils/custom-error.utils';

export function requireLandingPageAdmin(
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    const requestId = request.header('X-RqUID') || uuid();
    const authorization = request.header('Authorization') ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) {
        next(new CustomError(requestId, 401, 'Authorization credentials are invalid.'));
        return;
    }

    const user = verifyAccessToken(match[1]);
    if (!user) {
        next(new CustomError(requestId, 401, 'Authorization credentials are invalid.'));
        return;
    }

    response.locals.authenticatedUser = user;
    next();
}
