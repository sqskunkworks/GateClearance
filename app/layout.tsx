import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import type { Metadata } from 'next';


export const metadata = {
  title: 'Gate Clearance',
  description: 'San Quentin SkunkWorks Visitor Clearance App',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
