import {
    LandingPageAdminParameterRow,
    LandingPageMysqlGateway,
} from '../../infrastructure/database/landing-page.mysql.gateway';

export class GetLandingPageParametersService {
    constructor(private readonly gateway: LandingPageMysqlGateway) {}

    public async execute(): Promise<LandingPageAdminParameterRow[]> {
        return this.gateway.getAllParameters();
    }
}
