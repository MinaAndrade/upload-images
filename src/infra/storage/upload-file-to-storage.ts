import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';
import { Readable } from 'node:stream';
import { env } from '@/env';
import { Upload } from '@aws-sdk/lib-storage';
import { z } from 'zod';
import { r2 } from './client';

const uploadFileToStorageInput = z.object({
  folder: z.enum(['images', 'downloads']),
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
});

type UploadFileToStorageInput = z.input<typeof uploadFileToStorageInput>;

export async function uploadFileToStorage(input: UploadFileToStorageInput) {
  const { folder, fileName, contentType, contentStream } =
    uploadFileToStorageInput.parse(input);

  const fileExtension = extname(fileName);
  const fileNameWithoutExtension = basename(fileName, fileExtension);

  const sanitizedFileName = fileNameWithoutExtension.replace(
    /[^a-zA-Z0-9]/g,
    ''
  );
  const sanitizedFileNameWithExtension =
    sanitizedFileName.concat(fileExtension);

  const uniqueFileName = `${folder}/${randomUUID()}-${sanitizedFileNameWithExtension}`;

  const uploadResult = new Upload({
    client: r2,
    params: {
      Key: uniqueFileName,
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Body: contentStream,
      ContentType: contentType,
    },
  });

  await uploadResult.done();

  return {
    key: uniqueFileName,
    url: new URL(uniqueFileName, env.CLOUDFLARE_PUBLIC_URL).toString(),
  };
}
