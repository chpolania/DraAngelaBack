import 'dotenv/config';

const basicConfig = {
    API_PATH: process.env.API_PATH ?? '/v1/product',
    DEBUG: process.env.DEBUG ?? 'mati-arqsw:*',
    PORT: process.env.PORT ?? '9080'
}

const googleCalendarConfig = {
    CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
    SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
}

export default {
    basicConfig,
    googleCalendarConfig,
}
