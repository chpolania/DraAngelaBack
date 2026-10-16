import debugLib from 'debug';
import { NextFunction, Request, Response } from 'express';

import { CreateHairAnalysisService } from '../../application/use-cases/create-hair-analysis.service';
import { IUploadedImage } from '../../domain/interfaces/index.interface';
import { v4 as uuid } from 'uuid';
import { CustomError } from '../../utils/index.utils';
import config from '../../config/config';

const debug = debugLib(`${config.basicConfig.DEBUG}:hair-analysis.controller`);

export class HairAnalysisController {

    constructor(
        private readonly createHairAnalysisService: CreateHairAnalysisService,
    ) { }

    public async create(request: Request, response: Response, next: NextFunction): Promise<void> {
        const UUID: string = request.header('X-RqUID') || uuid();
        try {
            const files = ((request.files as Express.Multer.File[] | undefined) ?? []).map(
                (file): IUploadedImage => ({
                    buffer: file.buffer,
                    mimetype: file.mimetype,
                    originalname: file.originalname,
                }),
            );

            const result = await this.createHairAnalysisService.createHairAnalysis(UUID, {
                files,
                annotations: request.body?.annotations,
            });

            response.status(200).json(result);
            debug(`UUID: ${UUID} - Hair analysis completed for ${files.length} photo(s)`);
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                next(error);
                return;
            }
            debug(`UUID: ${UUID} - Hair analysis failed: ${(error as Error).message}`);
            next(new CustomError(UUID, 500, 'No fue posible completar el análisis capilar.'));
        }
    }
}
