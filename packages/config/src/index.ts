import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

let envLoaded = false;

function ensureEnvLoaded() {
  if (envLoaded) return;
  envLoaded = true;
  loadEnv();
}

const featureSchema = z.object({
  auth: z.boolean().default(true),
  payments: z.boolean().default(true),
  voice: z.boolean().default(true),
  chat: z.boolean().default(true),
  analytics: z.boolean().default(true),
  emails: z.boolean().default(true),
});

type FeatureFlags = z.infer<typeof featureSchema>;

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  databaseFile: z.string().default('data/database.json'),
  knowledgeBaseFile: z.string().default('data/knowledge-base.json'),
  featureOverrides: featureSchema.partial().default({}),
  defaultUserEmail: z.string().email().default('founder@example.com'),
  analyticsFlushInterval: z.number().default(5_000),
});

export interface AppConfig extends FeatureFlags {
  nodeEnv: 'development' | 'test' | 'production';
  databaseFile: string;
  knowledgeBaseFile: string;
  defaultUserEmail: string;
  analyticsFlushInterval: number;
}

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  ensureEnvLoaded();

  const parsed = configSchema.parse({
    nodeEnv: process.env.NODE_ENV,
    databaseFile: process.env.DATABASE_FILE,
    knowledgeBaseFile: process.env.KNOWLEDGE_BASE_FILE,
    featureOverrides: parseFeatureOverrides(process.env.FEATURE_FLAGS),
    defaultUserEmail: process.env.DEFAULT_USER_EMAIL,
    analyticsFlushInterval: safeNumber(process.env.ANALYTICS_FLUSH_INTERVAL),
  });

  const mergedFlags = featureSchema.parse({ ...parsed.featureOverrides });

  cachedConfig = {
    nodeEnv: parsed.nodeEnv,
    databaseFile: parsed.databaseFile,
    knowledgeBaseFile: parsed.knowledgeBaseFile,
    defaultUserEmail: parsed.defaultUserEmail,
    analyticsFlushInterval: parsed.analyticsFlushInterval,
    ...mergedFlags,
  };

  return cachedConfig;
}

function parseFeatureOverrides(flags?: string | null): Partial<FeatureFlags> {
  if (!flags) {
    return {};
  }

  try {
    const parsed = JSON.parse(flags);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    return parsed as Partial<FeatureFlags>;
  } catch {
    const entries = flags
      .split(',')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => pair.split('='));

    const overrides: Partial<FeatureFlags> = {};
    for (const [key, value] of entries) {
      if (!key) continue;
      overrides[key as keyof FeatureFlags] = value === 'true';
    }
    return overrides;
  }
}

function safeNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export type FeatureKey = keyof FeatureFlags;

export function isFeatureEnabled(key: FeatureKey, overrides: Partial<FeatureFlags> = {}): boolean {
  const config = getConfig();
  return { ...config, ...overrides }[key];
}

export function resetConfigCache() {
  cachedConfig = null;
  envLoaded = false;
}

