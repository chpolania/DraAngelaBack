import { CustomError } from '../../utils/custom-error.utils';
import { hashPassword } from '../../infrastructure/auth/argon2-password';
import { AppUserMysqlGateway } from '../../infrastructure/database/app-user.mysql.gateway';

interface CreateAppUserRequest {
    username: string;
    password: string;
    active?: boolean;
}

export interface CreatedAppUser {
    id: string;
    username: string;
    active: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateRequest(UUID: string, request: unknown): CreateAppUserRequest {
    if (!isRecord(request)) {
        throw new CustomError(UUID, 400, 'Request body must be a JSON object.');
    }

    const { username, password, active } = request;
    if (typeof username !== 'string'
        || username.trim() === ''
        || username.trim().length > 100) {
        throw new CustomError(UUID, 400, 'username must contain between 1 and 100 characters.');
    }
    if (typeof password !== 'string' || password.length === 0 || password.length > 1024) {
        throw new CustomError(UUID, 400, 'password must contain between 1 and 1024 characters.');
    }
    if (active !== undefined && typeof active !== 'boolean') {
        throw new CustomError(UUID, 400, 'active must be a boolean.');
    }

    return {
        username: username.trim(),
        password,
        active: active === undefined ? true : active,
    };
}

export class CreateAppUserService {
    constructor(private readonly users: AppUserMysqlGateway) {}

    public async execute(UUID: string, request: unknown): Promise<CreatedAppUser> {
        const user = validateRequest(UUID, request);
        const { passwordHash, passwordSalt } = await hashPassword(user.password);
        const active = user.active ?? true;

        try {
            const id = await this.users.createUser(
                user.username,
                passwordHash,
                passwordSalt,
                active,
            );
            return { id, username: user.username, active };
        } catch (error) {
            if (typeof error === 'object'
                && error !== null
                && 'code' in error
                && error.code === 'ER_DUP_ENTRY') {
                throw new CustomError(UUID, 409, 'A user with this username already exists.');
            }
            throw error;
        }
    }
}
