import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import UserInfo from '@/components/UserInfo'; 
import Link from 'next/link';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Analiza Akcji',
  description: 'Wykresy i analiza akcji',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className="dark">
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <AuthProvider>
          <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex items-center justify-between">
              <Link href="/" className="text-xl font-bold">
                  Analiza Akcji
              </Link>
              <ul className="flex space-x-4">
                <li>
                  <Link href="/" className="hover:text-blue-500">
                      Strona Główna
                  </Link>
                </li>
              </ul>
              <UserInfo /> 
            </div>
          </nav>
          <div className='container mx-auto'>{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}