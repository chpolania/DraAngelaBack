import { CustomError } from '../../utils/custom-error.utils';
import {
    LandingPageMysqlGateway,
    NewLandingPageTestimonial,
} from '../../infrastructure/database/landing-page.mysql.gateway';
import {
    requireAllowedFields,
    requireInteger,
    requireRecord,
    requireText,
} from './landing-page-update.validation';

const allowedFields = ['name', 'rating', 'comment', 'service', 'language'];

function validateTestimonial(UUID: string, request: unknown): NewLandingPageTestimonial {
    const fields = requireRecord(UUID, request);
    requireAllowedFields(UUID, fields, allowedFields);

    if (!('name' in fields)) {
        throw new CustomError(UUID, 400, 'name is required.');
    }
    if (!('rating' in fields)) {
        throw new CustomError(UUID, 400, 'rating is required.');
    }
    if (!('comment' in fields)) {
        throw new CustomError(UUID, 400, 'comment is required.');
    }

    requireText(UUID, fields, 'name', 150);
    requireInteger(UUID, fields, 'rating', 1, 5);
    requireText(UUID, fields, 'comment');
    if ('service' in fields) {
        requireText(UUID, fields, 'service', 150, true);
    }
    if ('language' in fields) {
        requireText(UUID, fields, 'language', 10);
        if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(fields.language as string)) {
            throw new CustomError(UUID, 400, 'language must be a valid language tag.');
        }
    }

    return {
        name: (fields.name as string).trim(),
        rating: fields.rating as number,
        comment: (fields.comment as string).trim(),
        service: fields.service === undefined ? null : fields.service as string | null,
        language: fields.language === undefined ? 'es-CO' : fields.language as string,
    };
}

export class CreatePublicLandingPageTestimonialService {
    constructor(private readonly gateway: LandingPageMysqlGateway) {}

    public async execute(UUID: string, request: unknown): Promise<{ id: string; active: false }> {
        const testimonial = validateTestimonial(UUID, request);
        const id = await this.gateway.createPublicTestimonial(testimonial);
        return { id, active: false };
    }
}
