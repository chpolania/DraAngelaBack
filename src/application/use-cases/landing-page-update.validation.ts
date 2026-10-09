import { CustomError } from '../../utils/custom-error.utils';

export type UpdateFields = Record<string, unknown>;

function isRecord(value: unknown): value is UpdateFields {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requireRecord(UUID: string, value: unknown): UpdateFields {
    if (!isRecord(value)) {
        throw new CustomError(UUID, 400, 'Request body must be a JSON object.');
    }
    return value;
}

export function requireAllowedFields(
    UUID: string,
    fields: UpdateFields,
    allowed: readonly string[],
): void {
    const keys = Object.keys(fields);
    if (keys.length === 0) {
        throw new CustomError(UUID, 400, 'At least one field must be provided.');
    }
    const invalidField = keys.find((key) => !allowed.includes(key));
    if (invalidField) {
        throw new CustomError(UUID, 400, `Field "${invalidField}" cannot be updated.`);
    }
}

export function requireText(
    UUID: string,
    fields: UpdateFields,
    key: string,
    maxLength?: number,
    nullable = false,
): void {
    const value = fields[key];
    if (nullable && value === null) {
        return;
    }
    if (typeof value !== 'string' || (!nullable && value.trim() === '')) {
        throw new CustomError(UUID, 400, `${key} must be ${nullable ? 'a string or null' : 'a non-empty string'}.`);
    }
    if (maxLength !== undefined && Array.from(value).length > maxLength) {
        throw new CustomError(UUID, 400, `${key} must be at most ${maxLength} characters.`);
    }
}

export function requireBoolean(
    UUID: string,
    fields: UpdateFields,
    key: string,
): void {
    const value = fields[key];
    if (value !== true && value !== false && value !== 0 && value !== 1) {
        throw new CustomError(UUID, 400, `${key} must be a boolean or 0/1.`);
    }
    fields[key] = value === true || value === 1 ? 1 : 0;
}

export function requireInteger(
    UUID: string,
    fields: UpdateFields,
    key: string,
    min: number,
    max?: number,
): void {
    const value = fields[key];
    if (typeof value !== 'number'
        || !Number.isInteger(value)
        || value < min
        || (max !== undefined && value > max)) {
        const range = max === undefined ? `at least ${min}` : `between ${min} and ${max}`;
        throw new CustomError(UUID, 400, `${key} must be an integer ${range}.`);
    }
}

export function requireId(UUID: string, id: unknown): string {
    if (typeof id !== 'string'
        || !/^[1-9]\d*$/.test(id)
        || BigInt(id) > 9223372036854775807n) {
        throw new CustomError(UUID, 400, 'Record id must be a positive integer.');
    }
    return id;
}
