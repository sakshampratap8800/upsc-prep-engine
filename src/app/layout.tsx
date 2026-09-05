import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
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
          <div className="flex h-screen w-full flex-col overflow-hidden">
            {/* Top Navigation Bar with Hamburger Icon */}
            <TopNav />
            
            {/* Main Content Area with Collapsible Sidebar */}
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto min-w-0">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
