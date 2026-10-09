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
    'name', 'rating', 'comment', 'testimonial_date', 'service',
    'verified', 'active', 'display_order', 'language',
];

export class UpdateLandingPageTestimonialService {
    constructor(private readonly gateway: LandingPageMysqlGateway) {}

    public async execute(UUID: string, id: unknown, request: unknown): Promise<{ id: string; updated: true }> {
        const recordId = requireId(UUID, id);
        const fields = requireRecord(UUID, request);
        requireAllowedFields(UUID, fields, editableFields);

        if ('name' in fields) {
            requireText(UUID, fields, 'name', 150);
        }
        if ('comment' in fields) {
            requireText(UUID, fields, 'comment');
        }
        if ('testimonial_date' in fields) {
            requireText(UUID, fields, 'testimonial_date', 100);
        }
        if ('service' in fields) {
            requireText(UUID, fields, 'service', 150, true);
        }
        if ('language' in fields) {
            requireText(UUID, fields, 'language', 10);
        }
        if ('rating' in fields) {
            requireInteger(UUID, fields, 'rating', 1, 5);
        }
        for (const key of ['verified', 'active']) {
            if (key in fields) {
                requireBoolean(UUID, fields, key);
            }
        }
        if ('display_order' in fields) {
            requireInteger(UUID, fields, 'display_order', -2147483648, 2147483647);
        }

        if (!await this.gateway.update('testimonial', recordId, fields)) {
            throw new CustomError(UUID, 404, 'Landing page testimonial was not found.');
        }
        return { id: recordId, updated: true };
    }
}
