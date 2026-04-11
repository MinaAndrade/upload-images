import { uploadImage } from "@/app/functions/upload-image";
import type { FastifyPluginAsync } from "fastify";

export const uploadImagesRoute: FastifyPluginAsync = async (server) => {
    server.post('/uploads', {
        schema: {
            summary: 'Upload an image',
            consumes: ['multipart/form-data'],

            body: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary',
                    },
                },
                required: ['file'],
            },

            response: {
                201: {
                    type: 'object',
                    properties: {
                        uploadId: { type: 'string' }
                    },
                    required: ['uploadId']
                },
                400: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    },
                    required: ['message']
                }
            }
        },

        // 👇 evita erro do Zod
        validatorCompiler: () => {
            return () => true;
        },
        serializerCompiler: () => {
            return (data) => JSON.stringify(data); // evita parse Zod
        }

    }, async (request, reply) => {

        const uploadedFile = await request.file({
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            }
        });

        if (!uploadedFile) {
            return reply.status(400).send({ message: 'File is required' });
        }

        await uploadImage({
            fileName: uploadedFile.filename,
            contentStream: uploadedFile.file,
            contentType: uploadedFile.mimetype,
        });

        return reply.status(201).send({ uploadId: 'teste' });
    });
};