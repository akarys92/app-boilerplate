import { getDatabase, Message } from '@app/db';
import { createChatCompletion } from '@app/llm';
import { createId } from '@app/utils';

export function getRecentMessages(threadId: string, limit = 20): Message[] {
  const db = getDatabase();
  const messages = db.getMessages(threadId);
  return messages.slice(Math.max(0, messages.length - limit));
}

export function sendChatMessage(threadId: string, content: string) {
  const db = getDatabase();
  const userMessage: Message = db.addMessage({
    threadId,
    role: 'user',
    content,
    id: createId('msg'),
  });

  const conversation = db.getMessages(threadId);
  const completion = createChatCompletion(conversation.map((message) => ({
    role: message.role,
    content: message.content,
  })));

  const assistantMessage: Message = db.addMessage({
    threadId,
    role: 'assistant',
    content: completion.message.content,
  });

  return {
    userMessage,
    assistantMessage,
    tokensUsed: completion.tokensUsed,
    responseTimeMs: completion.responseTimeMs,
  };
}

