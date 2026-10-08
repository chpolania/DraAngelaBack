import { google } from 'googleapis';

import {
    ICalendarBusyInterval,
    ICalendarAvailabilityReader,
    ICalendarEvent,
    ICalendarEventCreator,
    ICreatedCalendarEvent,
} from '../../domain/interfaces/calendar-event.interface';
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

export class GoogleCalendarGateway implements ICalendarEventCreator, ICalendarAvailabilityReader {
    public async createEvent(event: ICalendarEvent): Promise<ICreatedCalendarEvent> {
        const { CALENDAR_ID } = config.googleCalendarConfig;
        if (!CALENDAR_ID) {
            throw new Error('Missing Google Calendar configuration: GOOGLE_CALENDAR_ID.');
        }
        const calendar = google.calendar({ version: 'v3', auth: this.getAuth() });
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

    public async getBusyIntervals(
        timeMin: string,
        timeMax: string,
        timeZone: string,
    ): Promise<ICalendarBusyInterval[]> {
        const { CALENDAR_ID } = config.googleCalendarConfig;
        if (!CALENDAR_ID) {
            throw new Error('Missing Google Calendar configuration: GOOGLE_CALENDAR_ID.');
        }

        const calendar = google.calendar({ version: 'v3', auth: this.getAuth() });
        const busyIntervals: ICalendarBusyInterval[] = [];
        let pageToken: string | undefined;

        do {
            const response = await calendar.events.list({
                calendarId: CALENDAR_ID,
                timeMin,
                timeMax,
                timeZone,
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 2500,
                pageToken,
                fields: 'nextPageToken,items(start(date,dateTime),end(date,dateTime),status,transparency)',
            });

            for (const event of response.data.items ?? []) {
                if (event.status === 'cancelled' || event.transparency === 'transparent') {
                    continue;
                }

                const start = event.start?.dateTime ?? event.start?.date;
                const end = event.end?.dateTime ?? event.end?.date;
                if (start && end) {
                    busyIntervals.push({ start, end });
                }
            }

            pageToken = response.data.nextPageToken ?? undefined;
        } while (pageToken);

        return busyIntervals;
    }

    private getAuth() {
        const { SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY } = config.googleCalendarConfig;
        if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
            const missingConfiguration: string[] = [];
            if (!SERVICE_ACCOUNT_EMAIL) {
                missingConfiguration.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
            }
            if (!PRIVATE_KEY) {
                missingConfiguration.push('GOOGLE_PRIVATE_KEY');
            }
            throw new Error(`Missing Google Calendar configuration: ${missingConfiguration.join(', ')}.`);
        }

        return new google.auth.JWT({
            email: SERVICE_ACCOUNT_EMAIL,
            key: PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: [calendarScope],
        });
    }
}
