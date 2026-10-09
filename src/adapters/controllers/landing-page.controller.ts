import { NextFunction, Request, Response, Router } from 'express';
import { v4 as uuid } from 'uuid';

import { UpdateLandingPageParameterService } from '../../application/use-cases/update-landing-page-parameter.service';
import { UpdateLandingPageService } from '../../application/use-cases/update-landing-page-service.service';
import { UpdateLandingPageTestimonialService } from '../../application/use-cases/update-landing-page-testimonial.service';
import { GetLandingPageDataService } from '../../application/use-cases/get-landing-page-data.service';
import { GetLandingPageParametersService } from '../../application/use-cases/get-landing-page-parameters.service';
import { GetLandingPageServicesService } from '../../application/use-cases/get-landing-page-services.service';
import { GetLandingPageTestimonialsService } from '../../application/use-cases/get-landing-page-testimonials.service';

export class LandingPageController {
    private readonly router = Router();

    constructor(
        private readonly getLandingPageData: GetLandingPageDataService,
        private readonly getLandingPageParameters: GetLandingPageParametersService,
        private readonly getLandingPageServices: GetLandingPageServicesService,
        private readonly getLandingPageTestimonials: GetLandingPageTestimonialsService,
        private readonly updateParameter: UpdateLandingPageParameterService,
        private readonly updateService: UpdateLandingPageService,
        private readonly updateTestimonial: UpdateLandingPageTestimonialService,
    ) {
        this.router.get('/parameters', (req, res, next) => {
            this.getParameters(req, res, next).catch(next);
        });
        this.router.get('/services', (req, res, next) => {
            this.getServices(req, res, next).catch(next);
        });
        this.router.get('/testimonials', (req, res, next) => {
            this.getTestimonials(req, res, next).catch(next);
        });
        this.router.patch('/parameters/:id', (req, res, next) => {
            this.handleUpdate(req, res, next, this.updateParameter);
        });
        this.router.patch('/services/:id', (req, res, next) => {
            this.handleUpdate(req, res, next, this.updateService);
        });
        this.router.patch('/testimonials/:id', (req, res, next) => {
            this.handleUpdate(req, res, next, this.updateTestimonial);
        });
    }

    public getRouter(): Router {
        return this.router;
    }

    public async getData(
        request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const result = await this.getLandingPageData.execute(
                request.header('X-RqUID') || uuid(),
                request.query.language,
            );
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    private async getParameters(
        _request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const result = await this.getLandingPageParameters.execute();
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    private async getServices(
        _request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const result = await this.getLandingPageServices.execute();
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    private async getTestimonials(
        _request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const result = await this.getLandingPageTestimonials.execute();
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    private async handleUpdate(
        request: Request,
        response: Response,
        next: NextFunction,
        service: {
            execute: (requestId: string, id: unknown, body: unknown) => Promise<{ id: string; updated: true }>;
        },
    ): Promise<void> {
        const requestId = request.header('X-RqUID') || uuid();
        try {
            const result = await service.execute(requestId, request.params.id, request.body);
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
