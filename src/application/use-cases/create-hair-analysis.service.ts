import { z } from 'zod';

import {
    IHairAnalysisGateway,
    IImageAnnotator,
    IPhotoAnnotation,
    ICreateHairAnalysisRequest,
    ICreateHairAnalysisResponse,
} from '../../domain/interfaces/index.interface';
import { CustomError } from '../../utils/custom-error.utils';
import config from '../../config/config';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];

const pointSchema = z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
});

const polygonSchema = z
    .array(pointSchema)
    .min(3, 'Cada polígono necesita al menos tres puntos')
    .max(500, 'Demasiados puntos en un polígono');

const annotationsSchema = z
    .array(z.object({
        photoIndex: z.number().int().nonnegative(),
        polygons: z.array(polygonSchema).max(100),
    }))
    .min(1)
    .max(5)
    .superRefine((annotations, context) => {
        const indices = annotations.map((item) => item.photoIndex);
        if (new Set(indices).size !== indices.length) {
            context.addIssue({ code: 'custom', message: 'Hay índices de fotografías duplicados' });
        }
    });

export class CreateHairAnalysisService {

    constructor(
        private readonly gateway: IHairAnalysisGateway,
        private readonly imageAnnotator: IImageAnnotator,
    ) { }

    public async createHairAnalysis(
        UUID: string,
        request: ICreateHairAnalysisRequest,
    ): Promise<ICreateHairAnalysisResponse> {
        const { files } = request;
        const maxImages = config.hairAnalysisConfig.MAX_IMAGES;

        if (!Array.isArray(files) || files.length === 0) {
            throw new CustomError(UUID, 400, 'Debes enviar al menos una fotografía.');
        }
        if (files.length > maxImages) {
            throw new CustomError(UUID, 400, `El máximo permitido es ${maxImages} fotografías.`);
        }

        const annotations = this.parseAnnotations(UUID, request.annotations, files.length);

        for (const file of files) {
            try {
                const metadata = await this.imageAnnotator.inspect(file.buffer);
                if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format) || !metadata.width || !metadata.height) {
                    throw new Error('invalid');
                }
            } catch {
                throw new CustomError(UUID, 400, `El archivo ${file.originalname} no es una imagen válida compatible.`);
            }
        }

        const images = await Promise.all(files.map(async (file, index) => {
            const annotation = annotations.find((item) => item.photoIndex === index) ?? { photoIndex: index, polygons: [] };
            const { original, annotated } = await this.imageAnnotator.annotate(file.buffer, annotation);
            return { originalname: file.originalname, original, annotated };
        }));

        return { success: true, data: await this.gateway.analyze(images) };
    }

    private parseAnnotations(UUID: string, raw: unknown, imageCount: number): IPhotoAnnotation[] {
        let json: unknown;
        if (Array.isArray(raw)) {
            json = raw;
        } else if (typeof raw === 'string' && raw.length > 0) {
            try {
                json = JSON.parse(raw);
            } catch {
                throw new CustomError(UUID, 400, 'El campo annotations no contiene un JSON válido.');
            }
        } else {
            throw new CustomError(UUID, 400, 'Falta el campo annotations.');
        }

        const validation = annotationsSchema.safeParse(json);
        if (!validation.success) {
            const detail = validation.error.issues.map((issue) => issue.message).join('; ');
            throw new CustomError(UUID, 400, `Las anotaciones no son válidas: ${detail}`);
        }

        const received = validation.data.map((annotation) => annotation.photoIndex).sort((a, b) => a - b);
        if (received.length !== imageCount || received.some((value, index) => value !== index)) {
            throw new CustomError(
                UUID,
                400,
                'Las anotaciones deben incluir exactamente los índices de las fotografías recibidas',
            );
        }

        return validation.data;
    }
}
