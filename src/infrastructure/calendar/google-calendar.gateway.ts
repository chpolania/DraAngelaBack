import { google } from 'googleapis';

import {
    ICalendarEvent,
    ICalendarEventGateway,
    ICreatedCalendarEvent,
} from '../../domain/interfaces/index.interface';
import config from '../../config/config';

const calendarScope = 'https://www.googleapis.com/auth/calendar.events';

class CalendarIntegrationError extends Error {
    public readonly status = 502;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, CalendarIntegrationError.prototype);
    }
}

function getUpstreamStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null || !('response' in error)) {
        return undefined;
    }

    const response = error.response;
    if (typeof response !== 'object' || response === null || !('status' in response)) {
        return undefined;
    }

    return typeof response.status === 'number' ? response.status : undefined;
}

export class GoogleCalendarGateway implements ICalendarEventGateway {
    public async createEvent(event: ICalendarEvent): Promise<ICreatedCalendarEvent> {
        const { CALENDAR_ID, SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY } = config.googleCalendarConfig;
        if (!CALENDAR_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
            const missingConfiguration: string[] = [];
            if (!CALENDAR_ID) {
                missingConfiguration.push('GOOGLE_CALENDAR_ID');
            }
            if (!SERVICE_ACCOUNT_EMAIL) {
                missingConfiguration.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
            }
            if (!PRIVATE_KEY) {
                missingConfiguration.push('GOOGLE_PRIVATE_KEY');
            }
            throw new Error(`Missing Google Calendar configuration: ${missingConfiguration.join(', ')}.`);
        }

        const auth = new google.auth.JWT({
            email: SERVICE_ACCOUNT_EMAIL,
            key: PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: [calendarScope],
        });
        const calendar = google.calendar({ version: 'v3', auth });
        let response;
        try {
            response = await calendar.events.insert({
                calendarId: CALENDAR_ID,
                requestBody: event,
            });
        } catch (error) {
            if (getUpstreamStatus(error) === 404) {
                throw new CalendarIntegrationError(
                    'Google Calendar could not find the configured calendar or the service account cannot access it. Check GOOGLE_CALENDAR_ID and share that calendar with GOOGLE_SERVICE_ACCOUNT_EMAIL with permission to make changes to events.',
                );
            }

            throw error;
        }

        if (!response.data.id) {
            throw new Error('Google Calendar created the event without returning an event ID.');
        }

        return {
            id: response.data.id,
            ...(response.data.htmlLink ? { htmlLink: response.data.htmlLink } : {}),
        };
    }
}
