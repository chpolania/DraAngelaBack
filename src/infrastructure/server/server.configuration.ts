import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import actuator from 'express-actuator';
import logger from 'morgan';
import path from 'path';
import config from '../../config/config';

export class ServerConfiguration {

    private _app: Express;
    private _apiPath: string;
    private _fullApiPath: string;

    constructor() {
        this._app = express();
        this._apiPath = config.basicConfig.API_PATH;
        this._fullApiPath = `${this._apiPath}`;
        this.configure();
    }

    private configure(): void {
        this._app.use(logger('dev', { skip: (req, res) => req.path === '/management/health' }));
        this._app.use((request, response, next) => {
            response.header('Access-Control-Allow-Origin', '*');
            response.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

            const requestedHeaders = request.header('Access-Control-Request-Headers');
            if (requestedHeaders) {
                response.header('Access-Control-Allow-Headers', requestedHeaders);
                response.vary('Access-Control-Request-Headers');
            } else {
                response.header('Access-Control-Allow-Headers', 'Content-Type, X-RqUID, X-Name');
            }

            if (request.method === 'OPTIONS') {
                response.sendStatus(204);
                return;
            }

            next();
        });
        this._app.use(express.json());
        this._app.use(express.urlencoded({ extended: false }));
        this._app.use(cookieParser());
        this._app.use(express.static(path.join(__dirname, '../static')));

        this._app.use(
            actuator({
                basePath: '/management',
            }),
        );
    }


    public get app(): Express {
        return this._app;
    }

    public get fullApiPath(): string {
        return this._fullApiPath;
    }

}
