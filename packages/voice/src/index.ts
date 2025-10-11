import type { Buffer } from 'node:buffer';
import { getDatabase, VoiceSession } from '@app/db';
import { createId, truncate } from '@app/utils';

export function listVoiceSessions(): VoiceSession[] {
  const db = getDatabase();
  return db
    .getVoiceSessions()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function transcribeAudio(buffer: Buffer): VoiceSession {
  const db = getDatabase();
  const transcript = `Transcribed ${buffer.length} bytes of audio into text.`;
  return db.addVoiceSession({
    id: createId('evt'),
    title: truncate(transcript, 48),
    transcript,
    durationSeconds: Math.max(1, Math.round(buffer.length / 80)),
  });
}

export function synthesizeSpeech(text: string): { audioUrl: string } {
  const id = createId('evt');
  return {
    audioUrl: `https://voice.example.com/generated/${id}?text=${encodeURIComponent(text.slice(0, 80))}`,
  };
}

