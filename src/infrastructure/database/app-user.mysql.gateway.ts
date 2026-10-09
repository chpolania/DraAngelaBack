import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getMysqlPool } from './mysql-connection';

export interface AppUserCredentials {
    id: string;
    username: string;
    passwordHash: string;
    passwordSalt: string;
    active: boolean;
}

interface AppUserRow extends RowDataPacket {
    id: string | number | bigint;
    username: string;
    password_hash: string;
    password_salt: string;
    active: boolean | number;
}

export class AppUserMysqlGateway {
    public async createUser(
        username: string,
        passwordHash: string,
        passwordSalt: string,
        active = true,
    ): Promise<string> {
        const [result] = await getMysqlPool().execute<ResultSetHeader>(
            'INSERT INTO app_user (username, password_hash, password_salt, active) VALUES (?, ?, ?, ?)',
            [username, passwordHash, passwordSalt, active],
        );
        return String(result.insertId);
    }

    public async findByUsername(username: string): Promise<AppUserCredentials | undefined> {
        const [rows] = await getMysqlPool().execute<AppUserRow[]>(
            'SELECT id, username, password_hash, password_salt, active FROM app_user WHERE username = ? LIMIT 1',
            [username],
        );
        const user = rows[0];
        if (!user) {
            return undefined;
        }

        return {
            id: String(user.id),
            username: user.username,
            passwordHash: user.password_hash,
            passwordSalt: user.password_salt,
            active: user.active === true || user.active === 1,
        };
    }

    public async updateLastLogin(userId: string): Promise<void> {
        await getMysqlPool().execute(
            'UPDATE app_user SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
            [userId],
        );
    }
}
