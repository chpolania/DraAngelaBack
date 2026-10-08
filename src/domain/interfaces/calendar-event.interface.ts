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

export interface ICalendarEventGateway {
    createEvent(event: ICalendarEvent): Promise<ICreatedCalendarEvent>;
}
