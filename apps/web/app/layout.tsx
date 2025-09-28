import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Full-Stack AI Boilerplate Demo',
  description: 'Explore auth, payments, chat, voice, and analytics without writing code.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

