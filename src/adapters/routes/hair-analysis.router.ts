import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';

import { CreateHairAnalysisService } from '../../application/use-cases/create-hair-analysis.service';
import config from '../../config/config';
import { OpenAIHairAnalysisGateway } from '../../infrastructure/ai/openai-hair-analysis.gateway';
import { SharpImageAnnotator } from '../../infrastructure/image/sharp-image-annotator';
import { CustomError } from '../../utils/custom-error.utils';
import { HairAnalysisController } from '../controllers/hair-analysis.controller';
import { requireLandingPageAdmin } from '../middlewares/landing-page-admin-auth.middleware';

const { MAX_IMAGES, MAX_IMAGE_SIZE_MB } = config.hairAnalysisConfig;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: MAX_IMAGES,
        fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024,
        fields: 1,
        fieldSize: 100 * 1024,
        parts: MAX_IMAGES + 1,
    },
    fileFilter: (_request, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            callback(new CustomError('', 400, 'Formato no permitido. Usa JPG, PNG o WebP.'));
            return;
        }
        callback(null, true);
    },
});

const handleUpload = (request: Request, response: Response, next: NextFunction): void => {
    upload.array('images', MAX_IMAGES)(request, response, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        const UUID = request.header('X-RqUID') || uuid();
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                next(new CustomError(UUID, 413, 'Una fotografía supera el tamaño máximo permitido.'));
            } else if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
                next(new CustomError(UUID, 400, 'La cantidad de fotografías no está permitida.'));
            } else {
                next(new CustomError(UUID, 400, 'Error al recibir los archivos.'));
            }
            return;
        }

        if (error instanceof CustomError) {
            error.UUID = UUID;
        }
        next(error);
    });
};

const hairAnalysisRouter = Router();
const controller = new HairAnalysisController(
    new CreateHairAnalysisService(
        new OpenAIHairAnalysisGateway(),
        new SharpImageAnnotator(),
    ),
);

hairAnalysisRouter.post('/', requireLandingPageAdmin, handleUpload, (request, response, next) => {
    controller.create(request, response, next).catch(next);
});

export default hairAnalysisRouter;
