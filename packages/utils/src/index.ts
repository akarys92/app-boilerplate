import crypto from 'crypto';

export type IdPrefix =
  | 'usr'
  | 'org'
  | 'prd'
  | 'sub'
  | 'msg'
  | 'thr'
  | 'evt'
  | 'doc';

export function createId(prefix: IdPrefix = 'evt'): string {
  const bytes = crypto.randomBytes(6).toString('hex');
  return `${prefix}_${bytes}`;
}

export function formatCurrency(amountInCents: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
  return formatter.format(amountInCents / 100);
}

export function chunkText(source: string, maxLength = 500): string[] {
  if (!source.trim()) {
    return [];
  }

  const parts: string[] = [];
  let buffer = '';

  for (const sentence of source.split(/(?<=[.!?])\s+/g)) {
    if ((buffer + sentence).length > maxLength) {
      if (buffer) {
        parts.push(buffer.trim());
      }
      buffer = sentence;
    } else {
      buffer = `${buffer} ${sentence}`.trim();
    }
  }

  if (buffer) {
    parts.push(buffer.trim());
  }

  return parts;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function median(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function partition<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const left: T[] = [];
  const right: T[] = [];
  for (const item of items) {
    if (predicate(item)) {
      left.push(item);
    } else {
      right.push(item);
    }
  }
  return [left, right];
}

export function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ensureError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === 'string' ? error : JSON.stringify(error));
}

