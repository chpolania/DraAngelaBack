import { CustomError } from '../../utils/custom-error.utils';
import { LandingPageMysqlGateway } from '../../infrastructure/database/landing-page.mysql.gateway';
import {
    requireAllowedFields,
    requireBoolean,
    requireId,
    requireInteger,
    requireRecord,
    requireText,
} from './landing-page-update.validation';

const editableFields = [
    'title', 'badge', 'short_description', 'full_description', 'duration',
    'price', 'icon', 'benefits', 'active', 'display_order', 'language',
];

export class UpdateLandingPageService {
    constructor(private readonly gateway: LandingPageMysqlGateway) {}

    public async execute(UUID: string, id: unknown, request: unknown): Promise<{ id: string; updated: true }> {
        const recordId = requireId(UUID, id);
        const fields = requireRecord(UUID, request);
        requireAllowedFields(UUID, fields, editableFields);

        const textLimits: Record<string, number> = {
            title: 150,
            short_description: 500,
            duration: 50,
            price: 50,
            language: 10,
        };
        for (const [key, maxLength] of Object.entries(textLimits)) {
            if (key in fields) {
                requireText(UUID, fields, key, maxLength);
            }
        }
        if ('badge' in fields) {
            requireText(UUID, fields, 'badge', 50, true);
        }
        if ('full_description' in fields) {
            requireText(UUID, fields, 'full_description');
        }
        if ('icon' in fields) {
            requireText(UUID, fields, 'icon', 50, true);
        }
        if ('benefits' in fields) {
            if (!Array.isArray(fields.benefits)) {
                throw new CustomError(UUID, 400, 'benefits must be a JSON array.');
            }
            fields.benefits = JSON.stringify(fields.benefits);
        }
        if ('active' in fields) {
            requireBoolean(UUID, fields, 'active');
        }
        if ('display_order' in fields) {
            requireInteger(UUID, fields, 'display_order', -2147483648, 2147483647);
        }

        if (!await this.gateway.update('service', recordId, fields)) {
            throw new CustomError(UUID, 404, 'Landing page service was not found.');
        }
        return { id: recordId, updated: true };
    }
}
