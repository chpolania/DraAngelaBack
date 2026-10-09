import {
    LandingPageAdminServiceRow,
    LandingPageMysqlGateway,
} from '../../infrastructure/database/landing-page.mysql.gateway';

export class GetLandingPageServicesService {
    constructor(private readonly gateway: LandingPageMysqlGateway) {}

    public async execute(): Promise<LandingPageAdminServiceRow[]> {
        return this.gateway.getAllServices();
    }
}
