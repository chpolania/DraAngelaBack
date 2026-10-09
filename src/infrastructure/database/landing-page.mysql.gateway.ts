import { RowDataPacket } from 'mysql2';

import { getMysqlPool } from './mysql-connection';

export type LandingPageTable = 'parameter' | 'service' | 'testimonial';

export interface LandingPageParameterRow extends RowDataPacket {
    id: string;
    section: string;
    parameter_key: string;
    parameter_value: string;
    value_type: string;
    language: string;
}

export interface LandingPageAdminParameterRow extends LandingPageParameterRow {
    active: boolean | number;
}

export interface LandingPageServiceRow extends RowDataPacket {
    id: string;
    title: string;
    badge: string | null;
    short_description: string;
    full_description: string;
    duration: string;
    price: string;
    icon: string | null;
    benefits: unknown;
    language: string;
}

export interface LandingPageAdminServiceRow extends LandingPageServiceRow {
    active: boolean | number;
    display_order: number;
}

export interface LandingPageTestimonialRow extends RowDataPacket {
    id: string;
    name: string;
    rating: number;
    comment: string;
    testimonial_date: string;
    service: string | null;
    verified: boolean | number;
    language: string;
}

export interface LandingPageAdminTestimonialRow extends LandingPageTestimonialRow {
    active: boolean | number;
    display_order: number;
}

export interface LandingPageData {
    parameters: LandingPageParameterRow[];
    services: LandingPageServiceRow[];
    testimonials: LandingPageTestimonialRow[];
}

const tableNames: Record<LandingPageTable, string> = {
    parameter: 'landing_page_parameter',
    service: 'landing_page_service',
    testimonial: 'landing_page_testimonial',
};

const editableColumns: Record<LandingPageTable, readonly string[]> = {
    parameter: ['section', 'parameter_key', 'parameter_value', 'value_type', 'language', 'active'],
    service: [
        'title', 'badge', 'short_description', 'full_description', 'duration',
        'price', 'icon', 'benefits', 'active', 'display_order', 'language',
    ],
    testimonial: [
        'name', 'rating', 'comment', 'testimonial_date', 'service', 'verified',
        'active', 'display_order', 'language',
    ],
};

export class LandingPageMysqlGateway {
    public async getAllParameters(): Promise<LandingPageAdminParameterRow[]> {
        const pool = getMysqlPool();
        const [parameters] = await pool.execute<LandingPageAdminParameterRow[]>(
            `SELECT id, section, parameter_key, parameter_value, value_type, language, active
             FROM \`${tableNames.parameter}\`
             ORDER BY section, id`,
        );
        return parameters;
    }

    public async getAllServices(): Promise<LandingPageAdminServiceRow[]> {
        const pool = getMysqlPool();
        const [services] = await pool.execute<LandingPageAdminServiceRow[]>(
            `SELECT id, title, badge, short_description, full_description, duration, price,
                    icon, benefits, language, active, display_order
             FROM \`${tableNames.service}\`
             ORDER BY display_order, id`,
        );
        return services;
    }

    public async getAllTestimonials(): Promise<LandingPageAdminTestimonialRow[]> {
        const pool = getMysqlPool();
        const [testimonials] = await pool.execute<LandingPageAdminTestimonialRow[]>(
            `SELECT id, name, rating, comment, testimonial_date, service, verified, language,
                    active, display_order
             FROM \`${tableNames.testimonial}\`
             ORDER BY display_order, id`,
        );
        return testimonials;
    }

    public async getActiveData(language: string): Promise<LandingPageData> {
        const pool = getMysqlPool();
        const [parameters, services, testimonials] = await Promise.all([
            pool.execute<LandingPageParameterRow[]>(
                `SELECT id, section, parameter_key, parameter_value, value_type, language
                 FROM \`${tableNames.parameter}\`
                 WHERE active = 1 AND language = ?
                 ORDER BY section, id`,
                [language],
            ),
            pool.execute<LandingPageServiceRow[]>(
                `SELECT id, title, badge, short_description, full_description, duration, price,
                        icon, benefits, language
                 FROM \`${tableNames.service}\`
                 WHERE active = 1 AND language = ?
                 ORDER BY display_order, id`,
                [language],
            ),
            pool.execute<LandingPageTestimonialRow[]>(
                `SELECT id, name, rating, comment, testimonial_date, service, verified, language
                 FROM \`${tableNames.testimonial}\`
                 WHERE active = 1 AND language = ?
                 ORDER BY display_order, id`,
                [language],
            ),
        ]);

        return {
            parameters: parameters[0],
            services: services[0],
            testimonials: testimonials[0],
        };
    }

    public async update(
        table: LandingPageTable,
        id: string,
        fields: Record<string, unknown>,
    ): Promise<boolean> {
        const allowedColumns = editableColumns[table];
        const entries = Object.entries(fields);
        if (entries.length === 0 || entries.some(([column]) => !allowedColumns.includes(column))) {
            throw new Error('Invalid update fields for landing page table.');
        }

        const assignments = entries.map(([column]) => `\`${column}\` = ?`);
        assignments.push('`updated_at` = CURRENT_TIMESTAMP');
        const values = entries.map(([, value]) => {
            if (typeof value === 'string'
                || typeof value === 'number'
                || typeof value === 'bigint'
                || typeof value === 'boolean'
                || value === null
                || value instanceof Date
                || Buffer.isBuffer(value)
                || value instanceof Uint8Array) {
                return value;
            }
            throw new Error('Invalid SQL parameter for landing page update.');
        });

        const pool = getMysqlPool();
        const [result] = await pool.execute(
            `UPDATE \`${tableNames[table]}\` SET ${assignments.join(', ')} WHERE \`id\` = ?`,
            [...values, id],
        );

        if ('affectedRows' in result && result.affectedRows > 0) {
            return true;
        }

        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT 1 FROM \`${tableNames[table]}\` WHERE \`id\` = ? LIMIT 1`,
            [id],
        );
        return rows.length > 0;
    }
}
