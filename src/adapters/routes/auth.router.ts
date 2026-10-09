import { Router } from 'express';

import { CreateAppUserService } from '../../application/use-cases/create-app-user.service';
import { LoginService } from '../../application/use-cases/login.service';
import { AuthController } from '../controllers/auth.controller';
import { requireUserProvisioningToken } from '../middlewares/user-provisioning-auth.middleware';
import { AppUserMysqlGateway } from '../../infrastructure/database/app-user.mysql.gateway';

const authRouter = Router();
const userGateway = new AppUserMysqlGateway();
const authController = new AuthController(
    new LoginService(userGateway),
    new CreateAppUserService(userGateway),
);

authRouter.post('/users', requireUserProvisioningToken);
authRouter.use(authController.getRouter());

export default authRouter;
