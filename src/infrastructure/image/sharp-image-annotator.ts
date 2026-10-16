import sharp from 'sharp';

import {
    IImageAnnotator,
    IPhotoAnnotation,
    IPolygon,
} from '../../domain/interfaces/index.interface';

const MAX_INPUT_PIXELS = 40_000_000;

const toPixels = (value: number, dimension: number): number => {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return 0;
    }
    return Math.max(0, Math.min(1, number)) * dimension;
};

const createPolygonSvg = (width: number, height: number, polygons: IPolygon[]): Buffer => {
    const strokeWidth = Math.max(2, Math.min(width, height) * 0.004);
    const svgPolygons = polygons
        .filter((polygon) => Array.isArray(polygon) && polygon.length >= 3)
        .map((polygon) => {
            const points = polygon
                .map((point) => `${toPixels(point.x, width)},${toPixels(point.y, height)}`)
                .join(' ');
            return `<polygon points="${points}" fill="#22c55e" fill-opacity="0.25" stroke="#16a34a" stroke-width="${strokeWidth}" stroke-opacity="0.95" />`;
        })
        .join('');

    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgPolygons}</svg>`,
    );
};

export class SharpImageAnnotator implements IImageAnnotator {

    public async inspect(buffer: Buffer) {
        const metadata = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
        return { format: metadata.format, width: metadata.width, height: metadata.height };
    }

    public async annotate(buffer: Buffer, annotation: IPhotoAnnotation) {
        // Fixes EXIF orientation and normalizes to PNG.
        const original = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
            .rotate()
            .png()
            .toBuffer();

        const { width, height } = await sharp(original).metadata();
        if (!width || !height) {
            throw new Error('No fue posible determinar las dimensiones de la fotografía.');
        }

        if (annotation.polygons.length === 0) {
            return { original, annotated: original };
        }

        const annotated = await sharp(original)
            .composite([{ input: createPolygonSvg(width, height, annotation.polygons), blend: 'over' }])
            .png()
            .toBuffer();

        return { original, annotated };
    }
}
