import { fastifyCors } from '@fastify/cors';
import { fastifyMultipart } from '@fastify/multipart';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastify } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { getUploadsRoute } from './routes/get-upload';
import { uploadImagesRoute } from './routes/upload-images';
import { transformSwaggerSchema } from './transform-swagger-schema';
import { exportUploadsRoute } from './routes/export-uploads';

const server = fastify();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.setErrorHandler((error, request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: 'Validation error',
      issues: error.validation,
    });
  }
  console.error(error);
  return reply.status(500).send({ message: 'Internal Server Error' });
});

server.register(fastifyCors, { origin: '*' });

server.register(fastifyMultipart);
server.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Upload Server API',
      description: 'API for uploading files',
      version: '1.0.0',
    },
  },
  transform: transformSwaggerSchema,
});
server.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});

server.register(uploadImagesRoute);
server.register(getUploadsRoute);
server.register(exportUploadsRoute);

server.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('Server is running on http://localhost:3333');
});
