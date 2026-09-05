import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/context/SidebarContext';

export const metadata: Metadata = {
  title: 'UPSC Prep Engine',
  description: 'Personal UPSC CSE Preparation, PYQ Analysis & Revision System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased">
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto min-w-0">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
