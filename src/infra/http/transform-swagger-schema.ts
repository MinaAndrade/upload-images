import { jsonSchemaTransform } from 'fastify-type-provider-zod';

type TransformSwaggerSchemaData = Parameters<typeof jsonSchemaTransform>[0];

export function transformSwaggerSchema(data: TransformSwaggerSchemaData) {
    const { schema, url } = jsonSchemaTransform(data);

    // Se a rota consome multipart, garantimos a estrutura básica
    if (schema.consumes?.includes('multipart/form-data')) {

        // Garantindo requestBody
        if (!schema.requestBody) {
            schema.requestBody = {
                required: true,
                content: {}
            };
        }

        // Garantindo content
        if (!schema.requestBody.content) {
            schema.requestBody.content = {};
        }

        // Garantindo multipart/form-data
        if (!schema.requestBody.content['multipart/form-data']) {
            schema.requestBody.content['multipart/form-data'] = {
                schema: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            };
        }

        const multipartSchema =
            schema.requestBody.content['multipart/form-data'].schema;

        // Agora multipartSchema EXISTE
        multipartSchema.properties.file = {
            type: 'string',
            format: 'binary'
        };

        multipartSchema.required.push('file');
    }

    return { schema, url };
}