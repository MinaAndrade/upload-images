import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { env } from 'node:process';
import { serializerCompiler, validatorCompiler, hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { uploadImagesRoute } from './routes/upload-images';
import { fastifyMultipart } from '@fastify/multipart';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';

const server = fastify();

server.register(fastifyCors, { origin: '*' });
server.register(fastifyMultipart, {
    attachFieldsToBody: false,
});
server.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Upload Server API',
            description: 'API for uploading files',
            version: '1.0.0',
        },
    },
});
server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
});

server.register(uploadImagesRoute);

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
        return reply.status(400).send({
            message: 'Validation error',
            issues: error.validation
        });
    }
    console.error(error);
    return reply.status(500).send({ message: 'Internal Server Error' });
});

console.log(env.DATABASE_URL);

server.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
    console.log('Server is running on http://localhost:3333');
});