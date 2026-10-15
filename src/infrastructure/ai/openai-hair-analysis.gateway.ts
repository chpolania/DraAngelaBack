import OpenAI from 'openai';

import config from '../../config/config';
import {
    IAnalyzedImage,
    IHairAnalysisGateway,
    IHairAnalysisModelResult,
    IHairAnalysisResult,
} from '../../domain/interfaces/index.interface';

const resultSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        summary: { type: 'string' },
        photos: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    photoIndex: { type: 'integer' },
                    visibleCharacteristics: { type: 'string' },
                    markedZoneObservations: { type: 'string' },
                    imageQuality: { type: 'string', enum: ['good', 'acceptable', 'poor'] },
                },
                required: ['photoIndex', 'visibleCharacteristics', 'markedZoneObservations', 'imageQuality'],
            },
        },
        graftEstimate: {
            type: 'object',
            additionalProperties: false,
            properties: {
                status: { type: 'string', enum: ['preliminary_estimate', 'not_estimable_from_photos_alone'] },
                minimum: { type: ['integer', 'null'] },
                maximum: { type: ['integer', 'null'] },
                explanation: { type: 'string' },
            },
            required: ['status', 'minimum', 'maximum', 'explanation'],
        },
        missingInformation: { type: 'array', items: { type: 'string' } },
        clinicianReviewRequired: { type: 'boolean' },
        disclaimer: { type: 'string' },
    },
    required: ['summary', 'photos', 'graftEstimate', 'missingInformation', 'clinicianReviewRequired', 'disclaimer'],
};

const instructions = `
Eres un asistente de análisis visual para la planificación
preliminar de trasplantes capilares.

Tu tarea es analizar las fotografías originales y las fotografías
con las zonas receptoras marcadas con polígonos verdes.

Debes describir lo que observas y, cuando exista información visual
suficiente, intentar proporcionar un rango preliminar aproximado
del número de injertos que podrían requerirse.

IMPORTANTE: no te limites a decir que se necesita una evaluación
clínica. Debes intentar realizar una estimación visual preliminar
si las fotografías permiten identificar las zonas receptoras.

ANÁLISIS DE LAS FOTOGRAFÍAS:

1. Identifica las características visibles del cuero cabelludo.
2. Describe la ubicación y la extensión aparente de las zonas marcadas.
3. Evalúa la calidad de cada fotografía.
4. Identifica las vistas disponibles y las limitaciones de perspectiva.
5. Utiliza conjuntamente las fotografías que correspondan al mismo
   paciente, evitando contar dos veces una misma zona.
6. No confundas los polígonos verdes con cabello, lesiones ni
   características anatómicas.

ESTIMACIÓN PRELIMINAR DE INJERTOS:

1. Si puedes identificar las zonas receptoras y valorar su extensión
   aparente, intenta proponer un rango orientativo de injertos.

2. Considera la extensión visual de las zonas marcadas, su ubicación
   anatómica y las características visibles del cabello existente.

3. Si no existe una referencia de escala física, NO afirmes que
   conoces el área real en centímetros cuadrados. Indica que el rango
   tiene una incertidumbre elevada por falta de escala.

4. No inventes mediciones en centímetros cuadrados, densidades
   medidas, características de la zona donante ni datos clínicos
   que no estén presentes en las imágenes o en la información recibida.

5. Si puedes formular una estimación visual razonable, devuelve:
   - status: "preliminary_estimate"
   - minimum: límite inferior aproximado en número de injertos
   - maximum: límite superior aproximado en número de injertos
   - explanation: supuestos, limitaciones y nivel de incertidumbre.

6. El rango debe ser coherente con las zonas receptoras visibles.
   No utilices cifras arbitrarias ni un rango fijo para todos los
   pacientes. No presentes una cifra como resultado de una medición
   real si no has podido medir la superficie.

7. Si no hay escala física, no significa automáticamente que la
   estimación sea imposible. Intenta dar una aproximación visual
   únicamente cuando las imágenes permitan fundamentarla.

8. Utiliza minimum = null y maximum = null, con status =
   "not_estimable_from_photos_alone", únicamente si las imágenes
   son inutilizables o no permiten identificar ni valorar de forma
   mínimamente fundamentada las zonas receptoras.

9. Si la estimación no es posible, explica específicamente por qué
   y enumera en missingInformation los datos o fotografías que faltan.

10. Si faltan vistas superiores, laterales o posteriores, indícalo
    cuando esa ausencia limite la valoración.

11. No confundas número de injertos con número de cabellos.
    Un injerto puede contener más de un cabello.

12. clinicianReviewRequired debe ser true en todos los casos.
    La estimación es preliminar y debe ser revisada por un especialista.

FORMATO DE RESPUESTA:

- summary: resumen general.
- photos: una entrada por cada fotografía recibida.
- graftEstimate: rango aproximado cuando sea justificable.
- missingInformation: datos relevantes que faltan.
- clinicianReviewRequired: true.
- disclaimer: advertencia de que el resultado no sustituye
  una valoración médica.

Sé explícito con la incertidumbre. No ocultes limitaciones,
pero tampoco rechaces una estimación preliminar únicamente
porque no dispongas de todos los datos clínicos.
`;

const userPrompt = `
Analiza todas las fotografías adjuntas.

Intenta estimar un rango preliminar de injertos cuando las imágenes
permitan fundamentar una aproximación visual. No confundas la falta
de una escala física con una imposibilidad automática de estimar.

Si puedes estimar, devuelve un rango numérico conservador y explica
sus limitaciones. Si realmente no puedes, devuelve null en los dos
límites y explica qué impide la estimación.

No inventes mediciones físicas ni datos clínicos.

Devuelve exclusivamente el objeto JSON que cumple el esquema definido.
`.trim();

const toDataUrl = (buffer: Buffer): string => `data:image/png;base64,${buffer.toString('base64')}`;

const parseModelOutput = (outputText: string | undefined): IHairAnalysisModelResult => {
    if (!outputText) {
        throw new Error('OpenAI no devolvió contenido de texto para el análisis capilar.');
    }

    try {
        return JSON.parse(outputText) as IHairAnalysisModelResult;
    } catch {
        throw new Error('No fue posible interpretar la respuesta JSON del análisis capilar.');
    }
};

const validateEstimate = (result: IHairAnalysisModelResult): IHairAnalysisModelResult => {
    const estimate = result.graftEstimate;

    if (!estimate) {
        throw new Error('La respuesta de OpenAI no contiene graftEstimate.');
    }

    if (estimate.status === 'preliminary_estimate') {
        const { minimum, maximum } = estimate;
        if (
            !Number.isInteger(minimum) || (minimum as number) < 0
            || !Number.isInteger(maximum) || (maximum as number) < 0
            || (minimum as number) > (maximum as number)
        ) {
            throw new Error('OpenAI devolvió un rango de injertos preliminar inválido.');
        }
    }

    if (
        estimate.status === 'not_estimable_from_photos_alone'
        && (estimate.minimum !== null || estimate.maximum !== null)
    ) {
        throw new Error('La respuesta indica que no es estimable, pero contiene valores numéricos.');
    }

    result.clinicianReviewRequired = true;
    if (!Array.isArray(result.missingInformation)) {
        result.missingInformation = [];
    }

    return result;
};

export class OpenAIHairAnalysisGateway implements IHairAnalysisGateway {
    private client?: OpenAI;

    // Created lazily so the API can start without an OpenAI key configured.
    private getClient(): OpenAI {
        const apiKey = config.hairAnalysisConfig.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('Falta la variable OPENAI_API_KEY.');
        }
        this.client ??= new OpenAI({ apiKey });
        return this.client;
    }

    public async analyze(images: IAnalyzedImage[]): Promise<IHairAnalysisResult> {
        const model = config.hairAnalysisConfig.OPENAI_MODEL;
        const imageContent: OpenAI.Responses.ResponseInputContent[] = [];

        images.forEach((image, index) => {
            imageContent.push(
                {
                    type: 'input_text',
                    text: `Fotografía ${index + 1} de ${images.length}.\nNombre: ${image.originalname || `fotografia-${index + 1}`}.\nEsta es la imagen original. Analiza las características visibles.`,
                },
                { type: 'input_image', image_url: toDataUrl(image.original), detail: 'high' },
                {
                    type: 'input_text',
                    text: `Fotografía ${index + 1} con anotaciones.\nLos polígonos verdes representan las zonas que el usuario desea\nevaluar para la planificación del trasplante capilar.\nUtiliza estas marcas para identificar las zonas de interés.`,
                },
                { type: 'input_image', image_url: toDataUrl(image.annotated), detail: 'high' },
            );
        });

        const response = await this.getClient().responses.create({
            model,
            store: false,
            instructions,
            input: [{
                role: 'user',
                content: [{ type: 'input_text', text: userPrompt }, ...imageContent],
            }],
            text: {
                format: {
                    type: 'json_schema',
                    name: 'hair_analysis_result',
                    strict: true,
                    schema: resultSchema,
                },
            },
        });

        const result = validateEstimate(parseModelOutput(response.output_text));

        return {
            ...result,
            provider: 'openai',
            model,
            generatedAt: new Date().toISOString(),
        };
    }
}
