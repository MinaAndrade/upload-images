import { db, pg } from '@/infra/db';
import { schema } from '@/infra/db/schemas';
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage';
import { type Either, makeRight } from '@/shared/either';
import { stringify } from 'csv-stringify';
import { ilike } from 'drizzle-orm';
import { PassThrough, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';

const exportUploadsInput = z.object({
  searchQuery: z.string().optional(),
});

type ExportUploadsInput = z.input<typeof exportUploadsInput>;

type ExportUploadsOutput = {
  reportUrl: string;
};

export async function exportUploads(
  input: ExportUploadsInput
): Promise<Either<never, ExportUploadsOutput>> {
  const { searchQuery } = exportUploadsInput.parse(input);

  const { sql, params } = db
    .select({
      id: schema.uploads.id,
      name: schema.uploads.name,
      remoteUrl: schema.uploads.remoteUrl,
      createdAt: schema.uploads.createdAt,
    })
    .from(schema.uploads)
    .where(
      searchQuery ? ilike(schema.uploads.name, `%${searchQuery}%`) : undefined
    )
    .toSQL();

  // Cursor (retorna os dados de pouco em pouco, para não sobrecarregar a memória)
  // Não é seguro usar o unsafe porque os parâmetros são passados como string, mas
  // nesse caso é seguro porque o drizzle já faz a sanitização dos parâmetros
  const cursor = pg.unsafe(sql, params as string[]).cursor(50);

  // for await (const rows of cursor) {
  //   console.log(rows);
  // }

  const csv = stringify({
    delimiter: ',',
    header: true,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'remote_url', header: 'URL' },
      { key: 'created_at', header: 'Created At' },
    ],
  });

  const uploadToStorageStream = new PassThrough();

  const convertToCSVPipeline = pipeline(
    cursor,
    // O Transform é necessário para transformar os chunks de arrays de objetos
    // em objetos individuais, que é o formato esperado pelo csv-stringify
    new Transform({
      objectMode: true,
      transform(chunks: unknown[], encoding, callback) {
        for (const chunk of chunks) {
          this.push(chunk);
        }
        callback();
      },
    }),
    csv,
    // stream de escrita no Cloudflare R2
    uploadToStorageStream
  );

  const uploadToStorage = uploadFileToStorage({
    contentType: 'text/csv',
    folder: 'downloads',
    fileName: `${new Date().toISOString()}-uploads.csv`,
    contentStream: uploadToStorageStream,
  });

  const [{ url }] = await Promise.all([uploadToStorage, convertToCSVPipeline]);

  return makeRight({ reportUrl: url });
}
