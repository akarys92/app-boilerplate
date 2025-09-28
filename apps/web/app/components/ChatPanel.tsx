'use client';

import { useState, useTransition } from 'react';

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatPanelProps {
  threadId: string;
  initialMessages: ChatMessage[];
}

export default function ChatPanel({ threadId, initialMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('What is included in the payments integration?');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;

    startTransition(async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId, message }),
        });
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
        const payload = await response.json();
        setMessages((prev) => [...prev, payload.userMessage, payload.assistantMessage]);
        setInput('');
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div
        style={{
          borderRadius: 12,
          background: 'rgba(15,23,42,0.04)',
          padding: '1rem',
          display: 'grid',
          gap: '0.75rem',
          maxHeight: 280,
          overflowY: 'auto',
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'grid',
              gap: '0.35rem',
              justifyItems: message.role === 'user' ? 'end' : 'start',
            }}
          >
            <span
              style={{
                padding: '0.6rem 0.9rem',
                borderRadius: 12,
                background: message.role === 'user' ? 'rgba(37,99,235,0.15)' : '#ffffff',
                maxWidth: '90%',
                boxShadow: '0 10px 24px rgba(15,23,42,0.08)',
                color: '#0f172a',
                fontSize: '0.95rem',
                lineHeight: 1.4,
              }}
            >
              {message.content}
            </span>
            <small style={{ color: 'rgba(15,23,42,0.45)' }}>
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </small>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the onboarder..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 999,
            border: '1px solid rgba(15,23,42,0.12)',
            fontSize: '0.95rem',
          }}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{
            borderRadius: 999,
            padding: '0.75rem 1.4rem',
            background: isPending ? 'rgba(148,163,184,0.4)' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isPending ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

