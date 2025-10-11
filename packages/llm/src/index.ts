import { chunkText, average } from '@app/utils';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletion {
  message: ChatMessage;
  tokensUsed: number;
  responseTimeMs: number;
}

interface UsageTracker {
  tokensUsed: number;
  responseTimes: number[];
  totalSessions: number;
}

const usage: UsageTracker = {
  tokensUsed: 0,
  responseTimes: [],
  totalSessions: 0,
};

function synthesizeResponse(prompt: string): string {
  const chunks = chunkText(prompt, 120);
  const summary = chunks
    .map((chunk, index) => `• ${chunk.slice(0, 110)}${chunk.length > 110 ? '…' : ''}`)
    .join('\n');
  return `Here is what I understood:\n${summary}\n\nReady for the next step?`;
}

export function createChatCompletion(messages: ChatMessage[]): ChatCompletion {
  const start = Date.now();
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const prompt = lastUserMessage?.content ?? 'Hello!';
  const response = synthesizeResponse(prompt);
  const tokensUsed = Math.round(response.length / 4);
  const responseTimeMs = 100 + prompt.length * 2;

  usage.tokensUsed += tokensUsed;
  usage.responseTimes.push(Date.now() - start + responseTimeMs);
  usage.totalSessions += 1;

  return {
    message: { role: 'assistant', content: response },
    tokensUsed,
    responseTimeMs,
  };
}

export function streamChatCompletion(messages: ChatMessage[], onToken: (token: string) => void) {
  const completion = createChatCompletion(messages);
  for (const token of completion.message.content.split(' ')) {
    onToken(`${token} `);
  }
  return completion;
}

export function getUsageStatistics() {
  return {
    tokensUsed: usage.tokensUsed,
    avgResponseTimeMs: Math.round(average(usage.responseTimes)),
    totalSessions: usage.totalSessions,
  };
}

export function resetUsage() {
  usage.tokensUsed = 0;
  usage.responseTimes = [];
  usage.totalSessions = 0;
}

