import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'LMS - Premium Learning Platform',
  description: 'A sleek, premium, modern learning platform featuring role-based dashboards, secure quizzes, and tracking.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased custom-scrollbar">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
