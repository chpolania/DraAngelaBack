import { Router } from 'express';

import { CalendarController } from '../controllers/calendar.controller';
import { CreateCalendarEventService } from '../../application/use-cases/create-calendar-event.service';
import { GoogleCalendarGateway } from '../../infrastructure/calendar/google-calendar.gateway';

const calendarRouter = Router();
const calendarController = new CalendarController(
    new CreateCalendarEventService(new GoogleCalendarGateway()),
);

calendarRouter.use(calendarController.getRouter());

export default calendarRouter;
