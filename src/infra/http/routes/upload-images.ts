import { uploadImage } from "@/app/functions/upload-image";
import type { FastifyPluginAsync } from "fastify";
import { isRight, unwrapEither } from "@/shared/either";

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

        if (!request.isMultipart()) {
            return reply.status(400).send({ message: 'File is required' });
        }

        const uploadedFile = await request.file({
            limits: {
                fileSize: 2 * 1024 * 1024, // 2MB
            }
        });

        if (!uploadedFile) {
            return reply.status(400).send({ message: 'File is required' });
        }

        const result = await uploadImage({
            fileName: uploadedFile.filename,
            contentStream: uploadedFile.file,
            contentType: uploadedFile.mimetype,
        });

        if (uploadedFile.file.truncated) {
            return reply.status(400).send({ message: 'File size limit exceeded' });
        }

        if (isRight(result)) {
            console.log(unwrapEither(result));

            return reply.status(201).send();
        }

        const error = unwrapEither(result);

        switch (error.constructor.name) {
            case 'InvalidFileFormatError':
                return reply.status(400).send({ message: error.message });
        }
    });
};