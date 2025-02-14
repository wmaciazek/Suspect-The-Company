import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Analiza Akcji',
  description: 'Wykresy i analiza akcji',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark"> 
      <body className={inter.className}>{children}</body>
    </html>
  );
}