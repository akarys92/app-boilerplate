#!/usr/bin/env node
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

const envFilePath = existsSync(resolve(ROOT_DIR, '.env'))
  ? resolve(ROOT_DIR, '.env')
  : resolve(ROOT_DIR, '.env.example');
config({ path: envFilePath });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

const env = envSchema.parse(process.env);

interface IngestOptions {
  sourcePath: string;
  dryRun: boolean;
}

function parseArgs(): IngestOptions {
  const args = process.argv.slice(2);
  const options: IngestOptions = {
    sourcePath: resolve(ROOT_DIR, 'docs'),
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--path' || arg === '-p') {
      const value = args[i + 1];
      if (!value) {
        throw new Error('Missing value for --path');
      }
      options.sourcePath = resolve(ROOT_DIR, value);
      i += 1;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

async function collectMarkdownFiles(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
    } else if (extname(entry.name).match(/\.mdx?$/)) {
      files.push(fullPath);
    }
  }

  return files;
}

function slugFromPath(filePath: string) {
  return filePath
    .replace(ROOT_DIR, '')
    .replace(/^[\/\\]+/, '')
    .replace(/\/g, ':')
    .replace(/\.mdx?$/, '')
    .toLowerCase();
}

function chunkText(source: string, maxLength = 1200) {
  const paragraphs = source.split(/\n\s*\n/);
  const chunks: string[] = [];
  let buffer = '';

  for (const paragraph of paragraphs) {
    if ((buffer + '\n\n' + paragraph).length > maxLength) {
      if (buffer) {
        chunks.push(buffer.trim());
        buffer = '';
      }
    }
    buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
  }

  if (buffer) {
    chunks.push(buffer.trim());
  }

  return chunks;
}

function pseudoEmbedding(text: string) {
  const vector: number[] = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const charCode = text.charCodeAt(i);
    const index = charCode % vector.length;
    vector[index] += ((charCode % 29) + 1) / 100;
  }
  return `[${vector.join(',')}]`;
}

async function ingest() {
  const { sourcePath, dryRun } = parseArgs();
  if (!existsSync(sourcePath)) {
    throw new Error(`Source directory ${sourcePath} does not exist`);
  }

  const files = await collectMarkdownFiles(sourcePath);
  if (files.length === 0) {
    console.log('ℹ️  No markdown files found to ingest.');
    return;
  }

  console.log(`➡️  Ingesting ${files.length} markdown files from ${sourcePath}`);

  if (dryRun) {
    for (const file of files) {
      console.log(` • ${slugFromPath(file)}`);
    }
    console.log('Dry run complete.');
    return;
  }

  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    for (const file of files) {
      const content = await readFile(file, 'utf8');
      const slug = slugFromPath(file);
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : slug.split(':').pop() ?? slug;

      console.log(`   • ${slug}`);
      const docResult = await client.query(
        `
          INSERT INTO documents (slug, title, body)
          VALUES ($1, $2, $3)
          ON CONFLICT (slug) DO UPDATE SET
            title = EXCLUDED.title,
            body = EXCLUDED.body
          RETURNING id;
        `,
        [slug, title, content],
      );
      const documentId: string = docResult.rows[0].id;

      const chunks = chunkText(content);
      let chunkIndex = 0;
      for (const chunk of chunks) {
        await client.query(
          `
            INSERT INTO embeddings (document_id, chunk_index, embedding, metadata)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (document_id, chunk_index) DO UPDATE SET
              embedding = EXCLUDED.embedding,
              metadata = EXCLUDED.metadata;
          `,
          [documentId, chunkIndex, pseudoEmbedding(chunk), JSON.stringify({ path: file })],
        );
        chunkIndex += 1;
      }
    }

    console.log('✅ Ingestion complete.');
  } finally {
    await client.end();
  }
}

ingest().catch((error) => {
  console.error('❌ Ingestion failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
