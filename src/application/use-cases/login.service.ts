import { CustomError } from '../../utils/custom-error.utils';
import {
    ACCESS_TOKEN_LIFETIME_SECONDS,
    createAccessToken,
} from '../../infrastructure/auth/bearer-token';
import { verifyPassword } from '../../infrastructure/auth/argon2-password';
import { AppUserMysqlGateway } from '../../infrastructure/database/app-user.mysql.gateway';

interface LoginRequest {
    username: string;
    password: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export interface LoginResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
}

function validateCredentials(UUID: string, request: unknown): LoginRequest {
    if (!isRecord(request)) {
        throw new CustomError(UUID, 400, 'Request body must be a JSON object.');
    }

    const { username, password } = request;
    if (typeof username !== 'string'
        || username.trim() === ''
        || username.length > 100
        || typeof password !== 'string'
        || password.length === 0
        || password.length > 1024) {
        throw new CustomError(UUID, 400, 'username and password are required and must be valid strings.');
    }

    return { username: username.trim(), password };
}

export class LoginService {
    constructor(private readonly users: AppUserMysqlGateway) {}

    public async execute(UUID: string, request: unknown): Promise<LoginResponse> {
        const credentials = validateCredentials(UUID, request);
        const user = await this.users.findByUsername(credentials.username);

        const passwordMatches = await verifyPassword(
            credentials.password,
            user?.passwordHash,
            user?.passwordSalt,
        );
        if (!user || !user.active || !passwordMatches) {
            throw new CustomError(UUID, 401, 'Invalid username or password.');
        }

        const accessToken = createAccessToken({ id: user.id, username: user.username });
        await this.users.updateLastLogin(user.id);
        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: ACCESS_TOKEN_LIFETIME_SECONDS,
        };
    }
}
