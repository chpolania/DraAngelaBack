import {
    LandingPageAdminTestimonialRow,
    LandingPageMysqlGateway,
} from '../../infrastructure/database/landing-page.mysql.gateway';

export class GetLandingPageTestimonialsService {
    constructor(private readonly gateway: LandingPageMysqlGateway) {}

    public async execute(): Promise<LandingPageAdminTestimonialRow[]> {
        return this.gateway.getAllTestimonials();
    }
}
