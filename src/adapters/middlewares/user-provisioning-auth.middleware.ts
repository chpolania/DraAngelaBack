import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

import config from '../../config/config';
import { CustomError } from '../../utils/custom-error.utils';

export function requireUserProvisioningToken(
    request: Request,
    _response: Response,
    next: NextFunction,
): void {
    const requestId = request.header('X-RqUID') || uuid();
    const expectedToken = config.userProvisioningConfig.TOKEN;
    if (!expectedToken || Buffer.byteLength(expectedToken) < 32) {
        next(new CustomError(requestId, 503, 'User provisioning authentication is not configured.'));
        return;
    }

    const providedToken = request.header('X-User-Provisioning-Token');
    if (!providedToken) {
        next(new CustomError(requestId, 401, 'Provisioning credentials are invalid.'));
        return;
    }

    const provided = Buffer.from(providedToken);
    const expected = Buffer.from(expectedToken);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
        next(new CustomError(requestId, 401, 'Provisioning credentials are invalid.'));
        return;
    }

    next();
}
