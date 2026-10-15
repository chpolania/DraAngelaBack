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

const databaseConfig = {
    HOST: process.env.DB_HOST,
    PORT: process.env.DB_PORT ?? '3306',
    NAME: process.env.DB_NAME,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
}

const landingPageConfig = {
    JWT_SECRET: process.env.JWT_SECRET,
}

const userProvisioningConfig = {
    TOKEN: process.env.USER_PROVISIONING_TOKEN,
}

const hairAnalysisConfig = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    MAX_IMAGES: Math.min(5, Math.max(1, Number(process.env.HAIR_ANALYSIS_MAX_IMAGES ?? '5') || 5)),
    MAX_IMAGE_SIZE_MB: Math.min(20, Math.max(1, Number(process.env.HAIR_ANALYSIS_MAX_IMAGE_SIZE_MB ?? '8') || 8)),
}

export default {
    basicConfig,
    googleCalendarConfig,
    databaseConfig,
    landingPageConfig,
    userProvisioningConfig,
    hairAnalysisConfig,
}
