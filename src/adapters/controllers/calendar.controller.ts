import { NextFunction, Request, Response, Router } from 'express';
import { v4 as uuid } from 'uuid';

import { CreateCalendarEventService } from '../../application/use-cases/create-calendar-event.service';

export class CalendarController {
    private readonly router = Router();

    constructor(
        private readonly createCalendarEvent: CreateCalendarEventService,
    ) {
        this.router.post('/events', (req: Request, res: Response, next: NextFunction) => {
            this.createEvent(req, res, next).catch(next);
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
}
