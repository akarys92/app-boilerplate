#!/usr/bin/env node
import { readdirSync, readFileSync } from 'fs';
import { resolve, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, getDatabase } from '@app/db';
import { chunkText } from '@app/utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

async function ingest() {
  console.log('➡️  Ingesting knowledge base markdown...');
  initializeDatabase();
  const db = getDatabase();

  const knowledgeDir = resolve(ROOT, 'docs/knowledge-base');
  const files = readdirSync(knowledgeDir).filter((file) => file.endsWith('.md'));

  for (const file of files) {
    const fullPath = resolve(knowledgeDir, file);
    const body = readFileSync(fullPath, 'utf-8');
    const slug = basename(file, '.md');
    const embedding = buildDeterministicEmbedding(body);
    db.upsertKnowledgeBaseDocument({
      slug,
      title: toTitle(slug),
      body,
      embedding,
    });
    console.log(`   • Indexed ${slug} (${embedding.length} dims)`);
  }

  console.log('✔︎ Knowledge base ready.');
}

ingest().catch((error) => {
  console.error('❌ Failed to ingest documentation');
  console.error(error);
  process.exit(1);
});

function toTitle(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildDeterministicEmbedding(text: string): number[] {
  const slices = chunkText(text, 200);
  if (!slices.length) {
    return [0, 0, 0, 0, 0];
  }
  return slices.slice(0, 8).map((slice, index) => {
    const total = Array.from(slice).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return Math.round((total / slice.length) * (index + 1));
  });
}

