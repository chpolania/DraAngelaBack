import { NextFunction, Request, Response, Router } from 'express';
import { v4 as uuid } from 'uuid';

import { CreateAppUserService } from '../../application/use-cases/create-app-user.service';
import { LoginService } from '../../application/use-cases/login.service';

export class AuthController {
    private readonly router = Router();

    constructor(
        private readonly login: LoginService,
        private readonly createAppUser: CreateAppUserService,
    ) {
        this.router.post('/login', (request, response, next) => {
            this.loginUser(request, response, next).catch(next);
        });
        this.router.post('/users', (request, response, next) => {
            this.createUser(request, response, next).catch(next);
        });
    }

    public getRouter(): Router {
        return this.router;
    }

    private async loginUser(
        request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        const requestId = request.header('X-RqUID') || uuid();
        try {
            const result = await this.login.execute(requestId, request.body);
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    private async createUser(
        request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        const requestId = request.header('X-RqUID') || uuid();
        try {
            const result = await this.createAppUser.execute(requestId, request.body);
            response.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}
