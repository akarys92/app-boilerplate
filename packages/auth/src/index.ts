import crypto from 'crypto';
import { getDatabase, User } from '@app/db';
import { createId } from '@app/utils';
import { getConfig } from '@app/config';

export interface Session {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
}

const sessions = new Map<string, Session>();

function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const buffer = crypto.scryptSync(password, actualSalt, 32);
  return `${actualSalt}:${buffer.toString('hex')}`;
}

function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const [, hashedCandidate] = hashPassword(password, salt).split(':');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashedCandidate, 'hex'));
}

export function ensureDemoUser() {
  const db = getDatabase();
  const config = getConfig();
  const existing = db
    .getUsers()
    .find((user) => user.email === config.defaultUserEmail);

  if (!existing) {
    db.upsertUser({
      email: config.defaultUserEmail,
      name: 'Demo Founder',
      role: 'admin',
      avatarUrl: 'https://www.gravatar.com/avatar?d=identicon',
      passwordHash: hashPassword('demo1234'),
    });
  } else if (!existing.passwordHash) {
    db.upsertUser({ ...existing, passwordHash: hashPassword('demo1234') });
  }
}

export function authenticate(email: string, password: string) {
  const db = getDatabase();
  const user = db.getUsers().find((candidate) => candidate.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error('Invalid email or password');
  }
  const token = crypto.randomBytes(24).toString('hex');
  const session: Session = {
    id: createId('evt'),
    userId: user.id,
    token,
    createdAt: new Date().toISOString(),
  };
  sessions.set(token, session);
  return { user, session };
}

export function getSession(token: string | undefined | null): Session | null {
  if (!token) return null;
  return sessions.get(token) ?? null;
}

export function signOut(token: string) {
  sessions.delete(token);
}

export function getCurrentUser(token: string | undefined | null): User | null {
  const session = getSession(token);
  if (!session) return null;
  const db = getDatabase();
  return db.getUsers().find((user) => user.id === session.userId) ?? null;
}

