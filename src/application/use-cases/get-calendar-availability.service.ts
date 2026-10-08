import {
    ICalendarBusyInterval,
    ICalendarAvailabilityReader,
} from '../../domain/interfaces/calendar-event.interface';
import { CustomError } from '../../utils/custom-error.utils';

const timeZone = 'America/Bogota';
const openingHour = 8;
const closingHour = 18;

export interface IAvailableCalendarSlot {
    start: string;
    end: string;
    label: string;
}

export interface ICalendarAvailability {
    date: string;
    timeZone: string;
    slots: IAvailableCalendarSlot[];
}

function toCalendarDate(value: string): string | undefined {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) {
        return undefined;
    }

    const [, day, month, year] = match;
    const calendarDate = `${year}-${month}-${day}`;
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (parsed.getUTCFullYear() !== Number(year)
        || parsed.getUTCMonth() !== Number(month) - 1
        || parsed.getUTCDate() !== Number(day)) {
        return undefined;
    }

    return calendarDate;
}

function isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year
        && parsed.getUTCMonth() === month - 1
        && parsed.getUTCDate() === day;
}

function zonedTimeToUtc(date: string, hour: number): Date {
    const [year, month, day] = date.split('-').map(Number);
    const localAsUtc = Date.UTC(year, month - 1, day, hour);
    let timestamp = localAsUtc;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(new Date(timestamp));
        const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        const zonedAsUtc = Date.UTC(
            Number(values.year),
            Number(values.month) - 1,
            Number(values.day),
            Number(values.hour),
            Number(values.minute),
            Number(values.second),
        );
        timestamp = localAsUtc - (zonedAsUtc - timestamp);
    }

    return new Date(timestamp);
}

function intervalToTimestamps(
    interval: ICalendarBusyInterval,
): { start: number; end: number } | undefined {
    const start = /^\d{4}-\d{2}-\d{2}$/.test(interval.start)
        ? zonedTimeToUtc(interval.start, 0).getTime()
        : Date.parse(interval.start);
    const end = /^\d{4}-\d{2}-\d{2}$/.test(interval.end)
        ? zonedTimeToUtc(interval.end, 0).getTime()
        : Date.parse(interval.end);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return undefined;
    }

    return { start, end };
}

function formatHour(hour: number): string {
    const normalized = hour % 12 || 12;
    return `${normalized}${hour < 12 ? 'am' : 'pm'}`;
}

export class GetCalendarAvailabilityService {
    constructor(
        private readonly calendarEventGateway: ICalendarAvailabilityReader,
    ) {}

    public async execute(UUID: string, date: unknown): Promise<ICalendarAvailability> {
        const requestedDate = typeof date === 'string' ? date : undefined;
        const calendarDate = requestedDate ? toCalendarDate(requestedDate) : undefined;
        if (!requestedDate || !calendarDate || !isValidDate(calendarDate)) {
            throw new CustomError(UUID, 400, 'date must be a valid date in dd/MM/yyyy format.');
        }

        const timeMin = zonedTimeToUtc(calendarDate, openingHour);
        const timeMax = zonedTimeToUtc(calendarDate, closingHour);
        const busyIntervals = await this.calendarEventGateway.getBusyIntervals(
            timeMin.toISOString(),
            timeMax.toISOString(),
            timeZone,
        );
        const busy = busyIntervals
            .map(intervalToTimestamps)
            .filter((interval): interval is { start: number; end: number } => interval !== undefined);
        const slots: IAvailableCalendarSlot[] = [];

        for (let hour = openingHour; hour < closingHour; hour += 1) {
            const start = zonedTimeToUtc(calendarDate, hour);
            const end = zonedTimeToUtc(calendarDate, hour + 1);
            const startTimestamp = start.getTime();
            const endTimestamp = end.getTime();
            const overlapsBusy = busy.some(
                (interval) => interval.start < endTimestamp && interval.end > startTimestamp,
            );

            if (overlapsBusy || startTimestamp <= Date.now()) {
                continue;
            }

            slots.push({
                start: `${String(hour).padStart(2, '0')}:00`,
                end: `${String(hour + 1).padStart(2, '0')}:00`,
                label: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
            });
        }

        return { date: requestedDate, timeZone, slots };
    }
}
