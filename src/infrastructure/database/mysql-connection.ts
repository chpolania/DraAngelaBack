import { createPool, Pool } from 'mysql2/promise';

import config from '../../config/config';

let pool: Pool | undefined;

export function getMysqlPool(): Pool {
    if (pool) {
        return pool;
    }

    const { HOST, PORT, NAME, USER, PASSWORD } = config.databaseConfig;
    if (!HOST || !NAME || !USER || PASSWORD === undefined) {
        throw new Error('Database configuration is incomplete. Set DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD.');
    }

    const port = Number(PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('DB_PORT must be an integer between 1 and 65535.');
    }

    pool = createPool({
        host: HOST,
        port,
        database: NAME,
        user: USER,
        password: PASSWORD,
        charset: 'utf8mb4',
        supportBigNumbers: true,
        bigNumberStrings: true,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    return pool;
}
