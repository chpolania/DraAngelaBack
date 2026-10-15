export interface IPolygonPoint {
    x: number;
    y: number;
}

export type IPolygon = IPolygonPoint[];

export interface IPhotoAnnotation {
    photoIndex: number;
    polygons: IPolygon[];
}

export interface IUploadedImage {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
}

export type IImageQuality = 'good' | 'acceptable' | 'poor';

export interface IHairPhotoAnalysis {
    photoIndex: number;
    visibleCharacteristics: string;
    markedZoneObservations: string;
    imageQuality: IImageQuality;
}

export interface IGraftEstimate {
    status: 'preliminary_estimate' | 'not_estimable_from_photos_alone';
    minimum: number | null;
    maximum: number | null;
    explanation: string;
}

export interface IHairAnalysisModelResult {
    summary: string;
    photos: IHairPhotoAnalysis[];
    graftEstimate: IGraftEstimate;
    missingInformation: string[];
    clinicianReviewRequired: boolean;
    disclaimer: string;
}

export interface IHairAnalysisResult extends IHairAnalysisModelResult {
    provider: string;
    model: string;
    generatedAt: string;
}

export interface IAnalyzedImage {
    originalname: string;
    original: Buffer;
    annotated: Buffer;
}

export interface ICreateHairAnalysisRequest {
    files: IUploadedImage[];
    annotations: unknown;
}

export interface ICreateHairAnalysisResponse {
    success: true;
    data: IHairAnalysisResult;
}

/** Port: image processing used to overlay the user polygons. */
export interface IImageAnnotator {
    inspect(buffer: Buffer): Promise<{ format?: string; width?: number; height?: number }>;
    annotate(buffer: Buffer, annotation: IPhotoAnnotation): Promise<{ original: Buffer; annotated: Buffer }>;
}

/** Port: AI provider that analyzes the photos. */
export interface IHairAnalysisGateway {
    analyze(images: IAnalyzedImage[]): Promise<IHairAnalysisResult>;
}
