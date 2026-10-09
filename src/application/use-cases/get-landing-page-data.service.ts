import { CustomError } from '../../utils/custom-error.utils';
import {
    LandingPageMysqlGateway,
    LandingPageParameterRow,
    LandingPageServiceRow,
    LandingPageTestimonialRow,
} from '../../infrastructure/database/landing-page.mysql.gateway';

type ParameterValue =
    | string
    | number
    | boolean
    | null
    | ParameterValue[]
    | { [key: string]: ParameterValue };

export interface LandingPageResponse {
    parameters?: Record<string, Record<string, ParameterValue>>;
    services?: Array<{
        id: string;
        title: string;
        badge: string | null;
        shortDesc: string;
        fullDesc: string;
        duration: string;
        price: string;
        icon: string | null;
        benefits: unknown;
        language: string;
    }>;
    testimonials?: Array<{
        id: string;
        name: string;
        rating: number;
        comment: string;
        date: string;
        service: string | null;
        verified: boolean;
        language: string;
    }>;
}

function parseParameterValue(UUID: string, parameter: LandingPageParameterRow): ParameterValue {
    const value = parameter.parameter_value;
    switch (parameter.value_type.toLowerCase()) {
        case 'json':
            try {
                return JSON.parse(value) as ParameterValue;
            } catch {
                throw new CustomError(
                    UUID,
                    500,
                    `Parameter ${parameter.section}.${parameter.parameter_key} contains invalid JSON.`,
                );
            }
        case 'number': {
            const parsed = Number(value);
            if (!Number.isFinite(parsed)) {
                throw new CustomError(
                    UUID,
                    500,
                    `Parameter ${parameter.section}.${parameter.parameter_key} contains an invalid number.`,
                );
            }
            return parsed;
        }
        case 'boolean':
            if (value === 'true' || value === '1') {
                return true;
            }
            if (value === 'false' || value === '0') {
                return false;
            }
            throw new CustomError(
                UUID,
                500,
                `Parameter ${parameter.section}.${parameter.parameter_key} contains an invalid boolean.`,
            );
        default:
            return value;
    }
}

function mapParameters(
    UUID: string,
    rows: LandingPageParameterRow[],
): Record<string, Record<string, ParameterValue>> {
    return rows.reduce<Record<string, Record<string, ParameterValue>>>((sections, row) => {
        const section = sections[row.section] ?? {};
        section[row.parameter_key] = parseParameterValue(UUID, row);
        sections[row.section] = section;
        return sections;
    }, {});
}

function mapService(row: LandingPageServiceRow): NonNullable<LandingPageResponse['services']>[number] {
    return {
        id: row.id,
        title: row.title,
        badge: row.badge,
        shortDesc: row.short_description,
        fullDesc: row.full_description,
        duration: row.duration,
        price: row.price,
        icon: row.icon,
        benefits: row.benefits,
        language: row.language,
    };
}

function mapTestimonial(
    row: LandingPageTestimonialRow,
): NonNullable<LandingPageResponse['testimonials']>[number] {
    return {
        id: row.id,
        name: row.name,
        rating: row.rating,
        comment: row.comment,
        date: row.testimonial_date,
        service: row.service,
        verified: row.verified === true || row.verified === 1,
        language: row.language,
    };
}

export class GetLandingPageDataService {
    constructor(private readonly gateway: LandingPageMysqlGateway) {}

    public async execute(UUID: string, requestedLanguage: unknown = 'es-CO'): Promise<LandingPageResponse> {
        if (typeof requestedLanguage !== 'string') {
            throw new CustomError(UUID, 400, 'language must be a valid language tag.');
        }
        const language = requestedLanguage;
        if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(language)) {
            throw new CustomError(UUID, 400, 'language must be a valid language tag.');
        }

        const data = await this.gateway.getActiveData(language);
        const response: LandingPageResponse = {};

        if (data.parameters.length > 0) {
            response.parameters = mapParameters(UUID, data.parameters);
        }
        if (data.services.length > 0) {
            response.services = data.services.map(mapService);
        }
        if (data.testimonials.length > 0) {
            response.testimonials = data.testimonials.map(mapTestimonial);
        }

        return response;
    }
}
