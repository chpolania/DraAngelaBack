import { Router } from 'express';

import { UpdateLandingPageParameterService } from '../../application/use-cases/update-landing-page-parameter.service';
import { UpdateLandingPageService } from '../../application/use-cases/update-landing-page-service.service';
import { UpdateLandingPageTestimonialService } from '../../application/use-cases/update-landing-page-testimonial.service';
import { LandingPageController } from '../controllers/landing-page.controller';
import { requireLandingPageAdmin } from '../middlewares/landing-page-admin-auth.middleware';
import { LandingPageMysqlGateway } from '../../infrastructure/database/landing-page.mysql.gateway';
import { GetLandingPageDataService } from '../../application/use-cases/get-landing-page-data.service';
import { GetLandingPageParametersService } from '../../application/use-cases/get-landing-page-parameters.service';
import { GetLandingPageServicesService } from '../../application/use-cases/get-landing-page-services.service';
import { GetLandingPageTestimonialsService } from '../../application/use-cases/get-landing-page-testimonials.service';
import { CreatePublicLandingPageTestimonialService } from '../../application/use-cases/create-public-landing-page-testimonial.service';

const landingPageRouter = Router();
const gateway = new LandingPageMysqlGateway();
const controller = new LandingPageController(
    new GetLandingPageDataService(gateway),
    new GetLandingPageParametersService(gateway),
    new GetLandingPageServicesService(gateway),
    new GetLandingPageTestimonialsService(gateway),
    new CreatePublicLandingPageTestimonialService(gateway),
    new UpdateLandingPageParameterService(gateway),
    new UpdateLandingPageService(gateway),
    new UpdateLandingPageTestimonialService(gateway),
);

landingPageRouter.get('/', (request, response, next) => {
    controller.getData(request, response, next).catch(next);
});
landingPageRouter.post('/testimonials', (request, response, next) => {
    controller.createPublicReview(request, response, next).catch(next);
});
landingPageRouter.use(requireLandingPageAdmin);
landingPageRouter.use(controller.getRouter());

export default landingPageRouter;
