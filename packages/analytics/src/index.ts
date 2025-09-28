import { getDatabase } from '@app/db';
import { createId } from '@app/utils';

export interface TrackEventPayload {
  name: string;
  payload: Record<string, unknown>;
  userId?: string;
}

export function trackEvent(event: TrackEventPayload) {
  const db = getDatabase();
  return db.addAnalyticsEvent({
    id: createId('evt'),
    name: event.name,
    payload: event.payload,
    userId: event.userId,
  });
}

export function listAnalyticsEvents() {
  const db = getDatabase();
  return db.getAnalyticsEvents().slice(-10).reverse();
}

