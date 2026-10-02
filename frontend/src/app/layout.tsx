import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Vachana Audio Notes',
  description: 'Upload recordings, review transcripts, and manage audio notes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 64px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
