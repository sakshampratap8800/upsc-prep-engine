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
  type LucideIcon,
} from 'lucide-react';

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
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-6 py-5">
        <h1 className="text-lg font-bold tracking-tight text-stone-900">
          UPSC Prep Engine
        </h1>
        <p className="mt-0.5 text-xs text-stone-500">Personal Study System</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-stone-200 px-6 py-4">
        <p className="text-xs text-stone-400">UPSC CSE 2026</p>
        <p className="text-xs text-stone-400">18-Month Plan</p>
      </div>
    </aside>
  );
}
