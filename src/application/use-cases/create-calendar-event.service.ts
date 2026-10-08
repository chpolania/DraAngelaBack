import {
    ICalendarEvent,
    ICalendarEventCreator,
    ICreatedCalendarEvent,
} from '../../domain/interfaces/calendar-event.interface';
import { CustomError } from '../../utils/custom-error.utils';

type UnknownRecord = Record<string, unknown>;
type CalendarEventDateTime = UnknownRecord & { dateTime: string; timeZone: string };
type PatientDetails = {
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
    serviceTitle?: string;
    notes?: string;
};

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateTime(value: unknown): value is string {
    return typeof value === 'string'
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
        && Number.isFinite(Date.parse(value));
}

function isEventDateTime(value: unknown): value is CalendarEventDateTime {
    return isRecord(value)
        && isDateTime(value.dateTime)
        && typeof value.timeZone === 'string'
        && value.timeZone.trim() !== '';
}

function optionalText(
    UUID: string,
    value: unknown,
    fieldName: string,
): string | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new CustomError(UUID, 400, `${fieldName} must be a string.`);
    }
    return value.trim() || undefined;
}

export class CreateCalendarEventService {
    constructor(
        private readonly calendarEventGateway: ICalendarEventCreator,
    ) {}

    public async execute(
        UUID: string,
        request: unknown,
    ): Promise<ICreatedCalendarEvent> {
        const event = this.validateRequest(UUID, request);

        return this.calendarEventGateway.createEvent(event);
    }

    private validateRequest(UUID: string, request: unknown): ICalendarEvent {
        if (!isRecord(request)) {
            throw new CustomError(UUID, 400, 'Request body must be a JSON object.');
        }

        const {
            summary,
            description,
            location,
            start,
            end,
            attendees,
            patientName,
            patientEmail,
            patientPhone,
            serviceTitle,
            notes,
        } = request;
        if (typeof summary !== 'string' || summary.trim() === '') {
            throw new CustomError(UUID, 400, 'summary is required and must be a non-empty string.');
        }

        if (!isEventDateTime(start)) {
            throw new CustomError(UUID, 400, 'start must include a valid dateTime and timeZone.');
        }
        if (!isEventDateTime(end)) {
            throw new CustomError(UUID, 400, 'end must include a valid dateTime and timeZone.');
        }

        const startDateTime = start.dateTime;
        const endDateTime = end.dateTime;
        if (Date.parse(startDateTime) >= Date.parse(endDateTime)) {
            throw new CustomError(UUID, 400, 'end.dateTime must be later than start.dateTime.');
        }

        const eventDescription = optionalText(UUID, description, 'description');
        const eventLocation = optionalText(UUID, location, 'location');
        const patientDetails: PatientDetails = {
            patientName: optionalText(UUID, patientName, 'patientName'),
            patientEmail: optionalText(UUID, patientEmail, 'patientEmail'),
            patientPhone: optionalText(UUID, patientPhone, 'patientPhone'),
            serviceTitle: optionalText(UUID, serviceTitle, 'serviceTitle'),
            notes: optionalText(UUID, notes, 'notes'),
        };

        if (patientDetails.patientEmail && !this.isEmail(patientDetails.patientEmail)) {
            throw new CustomError(UUID, 400, 'patientEmail must be a valid email address.');
        }

        const attendeeEmails = this.validateAttendees(UUID, attendees);
        const normalizedAttendeeEmails = attendeeEmails.filter(
            (email) => email !== patientDetails.patientEmail,
        );
        const detailsDescription = this.formatPatientDetails(patientDetails, normalizedAttendeeEmails);
        const fullDescription = [eventDescription, detailsDescription]
            .filter((part): part is string => Boolean(part))
            .join('\n\n');

        return {
            summary: summary.trim(),
            ...(fullDescription ? { description: fullDescription } : {}),
            ...(eventLocation ? { location: eventLocation } : {}),
            start: { dateTime: startDateTime, timeZone: start.timeZone },
            end: { dateTime: endDateTime, timeZone: end.timeZone },
        };
    }

    private validateAttendees(
        UUID: string,
        attendees: unknown,
    ): string[] {
        if (attendees === undefined) {
            return [];
        }
        if (!Array.isArray(attendees)) {
            throw new CustomError(UUID, 400, 'attendees must be an array of email addresses.');
        }

        return attendees.map((attendee: unknown) => {
            if (!isRecord(attendee)
                || typeof attendee.email !== 'string'
                || !this.isEmail(attendee.email)) {
                throw new CustomError(UUID, 400, 'Each attendee must include a valid email address.');
            }

            return attendee.email.trim();
        });
    }

    private isEmail(value: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    private formatPatientDetails(patient: PatientDetails, attendeeEmails: string[]): string {
        const details: string[] = [];
        if (patient.patientName) {
            details.push(`Paciente: ${patient.patientName}`);
        }
        if (patient.patientEmail) {
            details.push(`Correo del paciente: ${patient.patientEmail}`);
        }
        if (patient.patientPhone) {
            details.push(`Teléfono del paciente: ${patient.patientPhone}`);
        }
        if (patient.serviceTitle) {
            details.push(`Servicio: ${patient.serviceTitle}`);
        }
        if (patient.notes) {
            details.push(`Notas: ${patient.notes}`);
        }
        if (attendeeEmails.length > 0) {
            details.push(`Correos asociados: ${attendeeEmails.join(', ')}`);
        }

        return details.length > 0 ? `Datos de la cita:\n${details.join('\n')}` : '';
    }
}
