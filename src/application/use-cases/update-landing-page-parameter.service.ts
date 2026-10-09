import { CustomError } from '../../utils/custom-error.utils';
import { LandingPageMysqlGateway } from '../../infrastructure/database/landing-page.mysql.gateway';
import {
    requireAllowedFields,
    requireBoolean,
    requireId,
    requireRecord,
    requireText,
    UpdateFields,
} from './landing-page-update.validation';

const editableFields = ['section', 'parameter_key', 'parameter_value', 'value_type', 'language', 'active'];

export class UpdateLandingPageParameterService {
    constructor(private readonly gateway: LandingPageMysqlGateway) {}

    public async execute(UUID: string, id: unknown, request: unknown): Promise<{ id: string; updated: true }> {
        const recordId = requireId(UUID, id);
        const fields = requireRecord(UUID, request);
        requireAllowedFields(UUID, fields, editableFields);

        const textLimits: Record<string, number> = {
            section: 50,
            parameter_key: 100,
            value_type: 20,
            language: 10,
        };
        for (const [key, maxLength] of Object.entries(textLimits)) {
            if (key in fields) {
                requireText(UUID, fields, key, maxLength);
            }
        }
        if ('parameter_value' in fields) {
            requireText(UUID, fields, 'parameter_value');
        }
        if ('active' in fields) {
            requireBoolean(UUID, fields, 'active');
        }

        await this.updateExisting(UUID, recordId, fields);
        return { id: recordId, updated: true };
    }

    private async updateExisting(UUID: string, id: string, fields: UpdateFields): Promise<void> {
        if (!await this.gateway.update('parameter', id, fields)) {
            throw new CustomError(UUID, 404, 'Landing page parameter was not found.');
        }
    }
}
