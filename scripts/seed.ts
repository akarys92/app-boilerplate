#!/usr/bin/env node
import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
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

async function seed() {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('BEGIN');

    console.log('➡️  Seeding users...');
    const userResult = await client.query(
      `
        INSERT INTO users (email, name, avatar_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id;
      `,
      ['founder@example.com', 'Demo Founder', 'https://www.gravatar.com/avatar?d=identicon'],
    );
    const founderId: string = userResult.rows[0].id;

    const memberResult = await client.query(
      `
        INSERT INTO users (email, name)
        VALUES ($1, $2)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id;
      `,
      ['member@example.com', 'Team Member'],
    );
    const memberId: string = memberResult.rows[0].id;

    console.log('➡️  Seeding products...');
    const products = [
      {
        name: 'Starter',
        stripe_product_id: process.env.STRIPE_PRICE_BASIC || null,
        description: 'Entry plan with generous limits for early teams.',
        price_cents: 2900,
        interval: 'month',
      },
      {
        name: 'Pro',
        stripe_product_id: process.env.STRIPE_PRICE_PRO || null,
        description: 'Unlock voice, advanced analytics, and higher limits.',
        price_cents: 9900,
        interval: 'month',
      },
    ];

    const productIds: string[] = [];
    for (const product of products) {
      const result = await client.query(
        `
          INSERT INTO products (name, description, price_cents, interval, stripe_product_id)
          VALUES ($1, $2, $3, $4, NULLIF($5, ''))
          ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            price_cents = EXCLUDED.price_cents,
            interval = EXCLUDED.interval,
            stripe_product_id = COALESCE(EXCLUDED.stripe_product_id, products.stripe_product_id)
          RETURNING id;
        `,
        [product.name, product.description, product.price_cents, product.interval, product.stripe_product_id ?? ''],
      );
      productIds.push(result.rows[0].id);
    }

    console.log('➡️  Seeding subscription...');
    await client.query(
      `
        INSERT INTO subscriptions (user_id, product_id, status, current_period_end, cancel_at_period_end)
        VALUES ($1, $2, 'active', NOW() + INTERVAL '30 days', false)
        ON CONFLICT (user_id) DO UPDATE SET
          product_id = EXCLUDED.product_id,
          status = EXCLUDED.status,
          current_period_end = EXCLUDED.current_period_end,
          cancel_at_period_end = EXCLUDED.cancel_at_period_end;
      `,
      [founderId, productIds[1] ?? productIds[0]],
    );

    console.log('➡️  Seeding demo thread + messages...');
    const threadId = '11111111-1111-1111-1111-111111111111';
    await client.query(
      `
        INSERT INTO threads (id, owner_id, title, metadata)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          owner_id = EXCLUDED.owner_id,
          title = EXCLUDED.title,
          metadata = EXCLUDED.metadata;
      `,
      [
        threadId,
        founderId,
        'Welcome to the AI boilerplate',
        JSON.stringify({ source: 'seed-script', topic: 'onboarding' }),
      ],
    );

    const messages = [
      {
        id: '11111111-1111-1111-1111-111111111112',
        role: 'system',
        content: 'You are the onboarder bot that helps users explore the demo.',
      },
      {
        id: '11111111-1111-1111-1111-111111111113',
        role: 'user',
        content: 'Give me a quick tour of what is included in this starter kit.',
      },
      {
        id: '11111111-1111-1111-1111-111111111114',
        role: 'assistant',
        content:
          'The boilerplate ships with web, mobile, payments, auth, LLM adapters, and analytics pre-wired. Explore the dashboard to see each integration in action.',
      },
    ];

    for (const [index, message] of messages.entries()) {
      await client.query(
        `
          INSERT INTO messages (id, thread_id, role, content, tokens)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            tokens = EXCLUDED.tokens;
        `,
        [message.id, threadId, message.role, message.content, message.content.split(' ').length * 4],
      );
      console.log(`   • Added ${message.role} message #${index + 1}`);
    }

    console.log('➡️  Writing audit trail entries...');
    await client.query(
      `
        INSERT INTO audit_logs (actor_id, action, target, metadata)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING;
      `,
      [
        memberId,
        'user.invited',
        'founder@example.com',
        JSON.stringify({ invitedBy: 'member@example.com', role: 'admin' }),
      ],
    );

    console.log('➡️  Seeding knowledge base document...');
    const readmePath = resolve(ROOT_DIR, 'README.md');
    const readme = readFileSync(readmePath, 'utf8');
    const docResult = await client.query(
      `
        INSERT INTO documents (slug, title, body)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          body = EXCLUDED.body
        RETURNING id;
      `,
      ['quickstart', 'Quickstart Guide', readme],
    );
    const documentId: string = docResult.rows[0].id;

    console.log('➡️  Generating deterministic embeddings for README (placeholder)...');
    const chunks = chunkMarkdown(readme, 1200);
    let chunkIndex = 0;
    for (const chunk of chunks) {
      const embedding = pseudoEmbedding(chunk);
      await client.query(
        `
          INSERT INTO embeddings (document_id, chunk_index, embedding, metadata)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (document_id, chunk_index) DO UPDATE SET
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata;
        `,
        [documentId, chunkIndex, embedding, JSON.stringify({ source: 'README.md' })],
      );
      chunkIndex += 1;
    }

    console.log(`✅ Seed completed (${chunkIndex} embedding chunks).`);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

function chunkMarkdown(source: string, maxLength: number) {
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
    buffer = buffer ? buffer + '\n\n' + paragraph : paragraph;
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
    vector[index] += (charCode % 31) / 100;
  }

  return `[${vector.join(',')}]`;
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
