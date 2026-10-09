import argon2, { HashOptions } from 'argon2';
import { randomBytes, timingSafeEqual } from 'crypto';

const ARGON2_OPTIONS: HashOptions = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
};

function decodeSalt(salt: string): Buffer | undefined {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(salt)) {
        return undefined;
    }

    const decoded = Buffer.from(salt, 'base64');
    if (decoded.length < 16 || decoded.toString('base64') !== salt) {
        return undefined;
    }
    return decoded;
}

export async function verifyPassword(
    password: string,
    passwordHash: string | undefined,
    passwordSalt: string | undefined,
): Promise<boolean> {
    const salt = passwordSalt ? decodeSalt(passwordSalt) : undefined;
    const expectedHash = passwordHash && /^[a-f0-9]{64}$/i.test(passwordHash)
        ? Buffer.from(passwordHash, 'hex')
        : undefined;

    if (!salt || !expectedHash) {
        await argon2.hash(password, {
            ...ARGON2_OPTIONS,
            salt: randomBytes(16),
            raw: true,
        });
        return false;
    }

    const actualHash = await argon2.hash(password, {
        ...ARGON2_OPTIONS,
        salt,
        raw: true,
    });
    return timingSafeEqual(actualHash, expectedHash);
}

export async function hashPassword(password: string): Promise<{ passwordHash: string; passwordSalt: string }> {
    const salt = randomBytes(16);
    const hash = await argon2.hash(password, {
        ...ARGON2_OPTIONS,
        salt,
        raw: true,
    });

    return {
        passwordHash: hash.toString('hex'),
        passwordSalt: salt.toString('base64'),
    };
}
