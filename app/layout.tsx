import './globals.css';
<<<<<<< HEAD

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
=======
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Gate Clearance',
  description: 'San Quentin SkunkWorks Visitor Clearance App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
>>>>>>> origin/dev
    </html>
  );
}
