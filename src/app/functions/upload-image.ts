import { Readable } from 'node:stream';
import { db } from '@/infra/db';
import { schema } from '@/infra/db/schemas';
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage';
import { type Either, makeLeft, makeRight } from '@/shared/either';
import { z } from 'zod';
import { InvalidFileFormatError } from './errors/invalid-file-format';

const uploadImageInput = z.object({
  fileName: z.string(),
  contentStream: z.instanceof(Readable),
  contentType: z.string(),
});

type UploadImageInput = z.input<typeof uploadImageInput>;

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export async function uploadImage(
  input: UploadImageInput
): Promise<Either<InvalidFileFormatError, { url: string }>> {
  const { fileName, contentStream, contentType } =
    uploadImageInput.parse(input);

  if (!allowedMimeTypes.includes(contentType)) {
    return makeLeft(new InvalidFileFormatError());
  }

  const { key, url } = await uploadFileToStorage({
    folder: 'images',
    fileName,
    contentType,
    contentStream,
  });

  await db.insert(schema.uploads).values({
    name: fileName,
    remoteKey: key,
    remoteUrl: url,
  });

  return makeRight({ url });
}
