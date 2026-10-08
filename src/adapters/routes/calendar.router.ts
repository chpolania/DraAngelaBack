import { Router } from 'express';

import { CalendarController } from '../controllers/calendar.controller';
import { CreateCalendarEventService } from '../../application/use-cases/create-calendar-event.service';
import { GetCalendarAvailabilityService } from '../../application/use-cases/get-calendar-availability.service';
import { GoogleCalendarGateway } from '../../infrastructure/calendar/google-calendar.gateway';

const calendarRouter = Router();
const calendarEventGateway = new GoogleCalendarGateway();
const calendarController = new CalendarController(
    new CreateCalendarEventService({
        createEvent: (event) => calendarEventGateway.createEvent(event),
    }),
    new GetCalendarAvailabilityService({
        getBusyIntervals: (timeMin, timeMax, timeZone) =>
            calendarEventGateway.getBusyIntervals(timeMin, timeMax, timeZone),
    }),
);

calendarRouter.use(calendarController.getRouter());

export default calendarRouter;
