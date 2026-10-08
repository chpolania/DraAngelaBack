import { NextFunction, Request, Response, Router } from 'express';
import { v4 as uuid } from 'uuid';

import { CreateCalendarEventService } from '../../application/use-cases/create-calendar-event.service';
import { GetCalendarAvailabilityService } from '../../application/use-cases/get-calendar-availability.service';

export class CalendarController {
    private readonly router = Router();

    constructor(
        private readonly createCalendarEvent: CreateCalendarEventService,
        private readonly getCalendarAvailability: GetCalendarAvailabilityService,
    ) {
        this.router.post('/events', (req: Request, res: Response, next: NextFunction) => {
            this.createEvent(req, res, next).catch(next);
        });
        this.router.get('/availability', (req: Request, res: Response, next: NextFunction) => {
            this.getAvailability(req, res, next).catch(next);
        });
    }

    public getRouter(): Router {
        return this.router;
    }

    private async createEvent(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const UUID = req.header('X-RqUID') || uuid();

        try {
            const event = await this.createCalendarEvent.execute(UUID, req.body);
            res.status(201).json(event);
        } catch (error) {
            next(error);
        }
    }

    private async getAvailability(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const UUID = req.header('X-RqUID') || uuid();

        try {
            const availability = await this.getCalendarAvailability.execute(UUID, req.query.date);
            res.status(200).json(availability);
        } catch (error) {
            next(error);
        }
    }
}
