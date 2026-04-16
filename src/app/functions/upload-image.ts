import { InvalidFileFormatError } from './errors/invalid-file-format';
import { db } from '@/infra/db';
import { schema } from '@/infra/db/schemas';
import { Readable } from 'node:stream';
import { type Either, makeLeft, makeRight } from '@/shared/either';
import { z } from 'zod';

const uploadImageInput = z.object({
    fileName: z.string(),
    contentStream: z.instanceof(Readable),
    contentType: z.string(),
});

type UploadImageInput = z.input<typeof uploadImageInput>;

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export async function uploadImage(input: UploadImageInput): Promise<Either<InvalidFileFormatError, { url: string }>> {

    const { fileName, contentStream, contentType } = uploadImageInput.parse(input);

    if (!allowedMimeTypes.includes(contentType)) {
        return makeLeft(new InvalidFileFormatError());
    }
    await db.insert(schema.uploads).values({
        name: fileName,
        remoteKey: fileName,
        remoteUrl: fileName,
    });

    return makeRight({ url: fileName });
}