import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/providers/AuthProvider';
import UserInfo from '@/components/UserInfo'; 
import Link from 'next/link';
import LoggedProvider from '@/providers/LoggedProvider';
import { FaChartBar } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { AlertProvider } from './contexts/AlertContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Strona-Projekt Analiza Firm',
  description: 'Wykresy, analiza akcji i informacje o firmach',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className="dark">
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <AuthProvider>
          <LoggedProvider>
            <Toaster position="top-right" />
            <nav className="bg-gray-800 p-4">
              <div className="container mx-auto flex items-center justify-between">
                <Link href="/landing" className="text-xl font-bold">
                  Analiza Akcji <FaChartBar className='inline-block bg-blue-500 rounded ml-1 text-white'/>
                </Link>
                <ul className="flex space-x-4">
                  <li>
                    <Link href="/" className="hover:text-blue-500">
                      Szukaj
                    </Link>
                  </li>
                </ul>
                <ul className="flex space-x-4">
                  <li>
                    <Link href="/history" className="hover:text-blue-500">
                      Historia Wyszukiwań
                    </Link>
                  </li>
                </ul>
                <ul className="flex space-x-4">
                  <li>
                    <Link href="/portfolio" className="hover:text-blue-500">
                      Portfolio
                    </Link>
                  </li>
                </ul>
                <UserInfo />
              </div>
            </nav>
            <div className='container mx-auto'>
              <AlertProvider>
                {children}
              </AlertProvider>
            </div>
          </LoggedProvider>
        </AuthProvider>
      </body>
    </html>
  );
}