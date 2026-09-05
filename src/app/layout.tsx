import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { EditModeProvider } from '@/context/EditModeContext';

export const metadata: Metadata = {
  title: 'UPSC Prep Engine',
  description: 'Personal UPSC CSE Preparation, PYQ Analysis & Revision System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          <EditModeProvider>
            <SidebarProvider>
            <div className="flex h-screen w-full flex-col overflow-hidden">
              {/* Top Navigation Bar with Dark Mode Toggle */}
              <TopNav />
              
              {/* Main Content Area with Collapsible Sidebar */}
              <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto min-w-0 bg-stone-50 dark:bg-stone-950">
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </EditModeProvider>
      </ThemeProvider>
    </body>
  </html>
);
}
