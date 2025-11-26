import { createHash } from 'crypto';

export function generateEventId (...args: any[]): string {
  const content = JSON.stringify(args);
  return createHash('sha256').update(content).digest('hex');
}

export function generateIdempotencyKey (): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
