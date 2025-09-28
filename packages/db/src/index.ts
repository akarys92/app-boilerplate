import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from '@app/config';
import { createId } from '@app/utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  passwordHash?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  interval: 'month' | 'year';
}

export interface Subscription {
  id: string;
  userId: string;
  productId: string;
  status: 'active' | 'trialing' | 'canceled';
  currentPeriodEnd: string;
}

export interface Thread {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  target: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeBaseDocument {
  id: string;
  title: string;
  slug: string;
  body: string;
  embedding: number[];
  updatedAt: string;
}

export interface VoiceSession {
  id: string;
  title: string;
  transcript: string;
  durationSeconds: number;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
  userId?: string;
}

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  subscriptions: Subscription[];
  threads: Thread[];
  messages: Message[];
  auditLogs: AuditLog[];
  knowledgeBase: KnowledgeBaseDocument[];
  voiceSessions: VoiceSession[];
  analyticsEvents: AnalyticsEvent[];
}

const DEFAULT_SCHEMA: DatabaseSchema = {
  users: [],
  products: [],
  subscriptions: [],
  threads: [],
  messages: [],
  auditLogs: [],
  knowledgeBase: [],
  voiceSessions: [],
  analyticsEvents: [],
};

function resolveDatabasePath(): string {
  const config = getConfig();
  if (config.databaseFile.startsWith('/')) {
    return config.databaseFile;
  }
  return resolve(__dirname, '..', '..', '..', config.databaseFile);
}

function readSchema(): DatabaseSchema {
  const dbPath = resolveDatabasePath();
  if (!existsSync(dbPath)) {
    return DEFAULT_SCHEMA;
  }
  const raw = readFileSync(dbPath, 'utf-8');
  return { ...DEFAULT_SCHEMA, ...JSON.parse(raw) } as DatabaseSchema;
}

function writeSchema(schema: DatabaseSchema) {
  const dbPath = resolveDatabasePath();
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(dbPath, JSON.stringify(schema, null, 2), 'utf-8');
}

export class Database {
  private schema: DatabaseSchema;

  constructor() {
    this.schema = readSchema();
  }

  reload() {
    this.schema = readSchema();
  }

  flush() {
    writeSchema(this.schema);
  }

  getUsers(): User[] {
    return [...this.schema.users];
  }

  upsertUser(user: Omit<User, 'id'> & { id?: string }): User {
    const existingIndex = user.id
      ? this.schema.users.findIndex((item) => item.id === user.id)
      : this.schema.users.findIndex((item) => item.email === user.email);

    if (existingIndex >= 0) {
      const updated: User = {
        ...this.schema.users[existingIndex]!,
        ...user,
        id: this.schema.users[existingIndex]!.id,
      };
      this.schema.users[existingIndex] = updated;
      this.flush();
      return updated;
    }

    const next: User = {
      id: user.id ?? createId('usr'),
      ...user,
    };
    this.schema.users.push(next);
    this.flush();
    return next;
  }

  getProducts(): Product[] {
    return [...this.schema.products];
  }

  upsertProduct(product: Omit<Product, 'id'> & { id?: string }): Product {
    const index = product.id
      ? this.schema.products.findIndex((item) => item.id === product.id)
      : this.schema.products.findIndex((item) => item.name === product.name);
    if (index >= 0) {
      const updated: Product = {
        ...this.schema.products[index]!,
        ...product,
        id: this.schema.products[index]!.id,
      };
      this.schema.products[index] = updated;
      this.flush();
      return updated;
    }
    const next: Product = {
      id: product.id ?? createId('prd'),
      ...product,
    };
    this.schema.products.push(next);
    this.flush();
    return next;
  }

  getSubscriptions(): Subscription[] {
    return [...this.schema.subscriptions];
  }

  upsertSubscription(subscription: Omit<Subscription, 'id'> & { id?: string }): Subscription {
    const index = subscription.id
      ? this.schema.subscriptions.findIndex((item) => item.id === subscription.id)
      : this.schema.subscriptions.findIndex((item) => item.userId === subscription.userId);
    if (index >= 0) {
      const updated: Subscription = {
        ...this.schema.subscriptions[index]!,
        ...subscription,
        id: this.schema.subscriptions[index]!.id,
      };
      this.schema.subscriptions[index] = updated;
      this.flush();
      return updated;
    }

    const next: Subscription = {
      id: subscription.id ?? createId('sub'),
      ...subscription,
    };
    this.schema.subscriptions.push(next);
    this.flush();
    return next;
  }

  getThreads(): Thread[] {
    return [...this.schema.threads];
  }

  upsertThread(thread: Omit<Thread, 'id'> & { id?: string }): Thread {
    const index = thread.id
      ? this.schema.threads.findIndex((item) => item.id === thread.id)
      : this.schema.threads.findIndex((item) => item.title === thread.title);

    if (index >= 0) {
      const updated: Thread = {
        ...this.schema.threads[index]!,
        ...thread,
        id: this.schema.threads[index]!.id,
      };
      this.schema.threads[index] = updated;
      this.flush();
      return updated;
    }

    const next: Thread = {
      id: thread.id ?? createId('thr'),
      createdAt: thread.createdAt ?? new Date().toISOString(),
      ...thread,
    };
    this.schema.threads.push(next);
    this.flush();
    return next;
  }

  getMessages(threadId?: string): Message[] {
    if (threadId) {
      return this.schema.messages.filter((message) => message.threadId === threadId);
    }
    return [...this.schema.messages];
  }

  addMessage(message: Omit<Message, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Message {
    const next: Message = {
      id: message.id ?? createId('msg'),
      createdAt: message.createdAt ?? new Date().toISOString(),
      ...message,
    };
    this.schema.messages.push(next);
    this.flush();
    return next;
  }

  getAuditLogs(): AuditLog[] {
    return [...this.schema.auditLogs];
  }

  addAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): AuditLog {
    const next: AuditLog = {
      id: entry.id ?? createId('evt'),
      createdAt: entry.createdAt ?? new Date().toISOString(),
      ...entry,
    };
    this.schema.auditLogs.push(next);
    this.flush();
    return next;
  }

  getKnowledgeBase(): KnowledgeBaseDocument[] {
    return [...this.schema.knowledgeBase];
  }

  upsertKnowledgeBaseDocument(doc: Omit<KnowledgeBaseDocument, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }): KnowledgeBaseDocument {
    const index = doc.id
      ? this.schema.knowledgeBase.findIndex((item) => item.id === doc.id)
      : this.schema.knowledgeBase.findIndex((item) => item.slug === doc.slug);

    if (index >= 0) {
      const updated: KnowledgeBaseDocument = {
        ...this.schema.knowledgeBase[index]!,
        ...doc,
        id: this.schema.knowledgeBase[index]!.id,
        updatedAt: new Date().toISOString(),
      };
      this.schema.knowledgeBase[index] = updated;
      this.flush();
      return updated;
    }

    const next: KnowledgeBaseDocument = {
      id: doc.id ?? createId('doc'),
      updatedAt: doc.updatedAt ?? new Date().toISOString(),
      ...doc,
    };
    this.schema.knowledgeBase.push(next);
    this.flush();
    return next;
  }

  getAnalyticsEvents(): AnalyticsEvent[] {
    return [...this.schema.analyticsEvents];
  }

  addAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): AnalyticsEvent {
    const next: AnalyticsEvent = {
      id: event.id ?? createId('evt'),
      createdAt: event.createdAt ?? new Date().toISOString(),
      ...event,
    };
    this.schema.analyticsEvents.push(next);
    this.flush();
    return next;
  }

  getVoiceSessions(): VoiceSession[] {
    return [...this.schema.voiceSessions];
  }

  addVoiceSession(session: Omit<VoiceSession, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): VoiceSession {
    const next: VoiceSession = {
      id: session.id ?? createId('evt'),
      createdAt: session.createdAt ?? new Date().toISOString(),
      ...session,
    };
    this.schema.voiceSessions.push(next);
    this.flush();
    return next;
  }
}

let singleton: Database | null = null;

export function getDatabase(): Database {
  if (!singleton) {
    singleton = new Database();
  }
  return singleton;
}

export function resetDatabase() {
  singleton = null;
}

export function initializeDatabase() {
  const dbPath = resolveDatabasePath();
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(dbPath)) {
    writeSchema(DEFAULT_SCHEMA);
  }
}

