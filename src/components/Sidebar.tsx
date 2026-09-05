'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  GraduationCap,
  Calendar,
  Search,
  RotateCcw,
  Target,
  AlertCircle,
  GitCompare,
  Database,
  Activity,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Library', href: '/library', icon: BookOpen },
  { label: 'PYQ Browser', href: '/pyq', icon: FileQuestion },
  { label: 'Syllabus', href: '/syllabus', icon: GraduationCap },
  { label: 'Timetable', href: '/timetable', icon: Calendar },
  { label: 'Revision', href: '/revision', icon: RotateCcw },
  { label: 'Practice', href: '/practice', icon: Target },
  { label: 'Error Log', href: '/errors', icon: AlertCircle },
  { label: 'Compare Optionals', href: '/compare', icon: GitCompare },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Import Data', href: '/import', icon: Database },
  { label: 'Data Health', href: '/data-health', icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();

  return (
    <aside
      className={`relative flex h-full flex-col border-r border-stone-200 bg-white transition-all duration-300 ease-in-out shrink-0 ${
        isOpen ? 'w-64' : 'w-0 border-r-0 overflow-hidden'
      }`}
    >
      {/* Header with Title & Collapse */}
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 min-w-[16rem]">
        <div className="truncate">
          <h1 className="text-base font-bold tracking-tight text-stone-900">
            UPSC Prep Engine
          </h1>
          <p className="text-[11px] text-stone-500">Personal Study System</p>
        </div>
        <button
          onClick={toggle}
          title="Collapse sidebar"
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 min-w-[16rem]">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-stone-200 px-5 py-3 min-w-[16rem]">
        <p className="text-xs font-semibold text-stone-700">UPSC CSE 2027</p>
        <p className="text-[11px] text-stone-400">Master Plan & Daily Execution</p>
      </div>
    </aside>
  );
}
