import 'fastify';

declare module 'fastify' {
    interface FastifySchema {
        requestBody?: {
            required?: boolean;
            content?: Record<string, { schema: any }>;
        };
    }
}