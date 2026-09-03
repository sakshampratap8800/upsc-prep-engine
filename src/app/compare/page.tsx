import { PageHeader } from '@/components/PageHeader';
import prisma from '@/lib/db';
import { GitCompare } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';

export default async function ComparePage() {
  let anthroCount = 0;
  let socioCount = 0;
  let anthroYears: number[] = [];
  let socioYears: number[] = [];

  try {
    anthroCount = await prisma.pYQ.count({ where: { examStage: 'Anthropology' } });
    socioCount = await prisma.pYQ.count({ where: { examStage: 'Sociology' } });

    const anthroYearData = await prisma.pYQ.groupBy({ by: ['year'], where: { examStage: 'Anthropology' }, orderBy: { year: 'asc' } });
    anthroYears = anthroYearData.map(y => y.year);
    const socioYearData = await prisma.pYQ.groupBy({ by: ['year'], where: { examStage: 'Sociology' }, orderBy: { year: 'asc' } });
    socioYears = socioYearData.map(y => y.year);
  } catch {
    // DB not ready
  }

  const hasData = anthroCount > 0 || socioCount > 0;

  return (
    <div>
      <PageHeader
        title="Optional Subject Comparison"
        description="Compare Anthropology vs Sociology to help you decide your optional"
      />

      {!hasData ? (
        <EmptyState
          icon={GitCompare}
          title="No optional PYQs imported yet"
          description="Import PYQs to compare Anthropology and Sociology."
          action={
            <Link href="/import" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
              Import PYQs
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Anthropology */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-xl font-bold text-stone-900">Anthropology</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total PYQs</span>
                <span className="font-semibold text-stone-900">{anthroCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Years Available</span>
                <span className="font-semibold text-stone-900">{anthroYears.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Year Range</span>
                <span className="font-semibold text-stone-900">
                  {anthroYears.length > 0 ? `${anthroYears[0]}\u2013${anthroYears[anthroYears.length - 1]}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Papers</span>
                <span className="font-semibold text-stone-900">Paper I + Paper II</span>
              </div>
            </div>
            <Link href="/pyq?stage=Anthropology" className="mt-4 block text-center text-sm font-medium text-stone-600 hover:text-stone-900">
              Browse Anthropology PYQs \u2192
            </Link>
          </div>

          {/* Sociology */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-xl font-bold text-stone-900">Sociology</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total PYQs</span>
                <span className="font-semibold text-stone-900">{socioCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Years Available</span>
                <span className="font-semibold text-stone-900">{socioYears.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Year Range</span>
                <span className="font-semibold text-stone-900">
                  {socioYears.length > 0 ? `${socioYears[0]}\u2013${socioYears[socioYears.length - 1]}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Papers</span>
                <span className="font-semibold text-stone-900">Paper I + Paper II</span>
              </div>
            </div>
            <Link href="/pyq?stage=Sociology" className="mt-4 block text-center text-sm font-medium text-stone-600 hover:text-stone-900">
              Browse Sociology PYQs \u2192
            </Link>
          </div>

          {/* Comparison Note */}
          <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This is a basic comparison based on available PYQ data. A deeper comparison including syllabus size, recurring themes, question patterns, and revision burden will be available after running the intelligence pipeline (Phase 2).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
