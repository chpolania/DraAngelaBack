export interface ICalendarEvent {
    summary: string;
    description?: string;
    location?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
}

export interface ICreatedCalendarEvent {
    id: string;
    htmlLink?: string;
}

export interface ICalendarBusyInterval {
    start: string;
    end: string;
}

export interface ICalendarEventCreator {
    createEvent(event: ICalendarEvent): Promise<ICreatedCalendarEvent>;
}

export interface ICalendarAvailabilityReader {
    getBusyIntervals(
        timeMin: string,
        timeMax: string,
        timeZone: string,
    ): Promise<ICalendarBusyInterval[]>;
}
