import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { RelevanceBadge } from '@/components/RelevanceBadge';
import prisma from '@/lib/db';
import { RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default async function RevisionPage() {
  let pendingItems: Array<{ id: number; title: string; priority: string; reviewCount: number; lastReviewedAt: Date | null }> = [];
  let completedCount = 0;

  try {
    pendingItems = await prisma.revisionItem.findMany({
      where: { status: 'pending' },
      orderBy: [{ priority: 'desc' }, { reviewCount: 'asc' }],
      take: 50,
    });
    completedCount = await prisma.revisionItem.count({ where: { status: 'completed' } });
  } catch {
    // DB not ready
  }

  return (
    <div>
      <PageHeader
        title="Revision Queue"
        description={`${pendingItems.length} items pending \u2022 ${completedCount} completed`}
      />

      {pendingItems.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No revision items yet"
          description="Revision items will be generated after importing and studying your materials."
          action={
            <Link href="/library" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
              Browse Library
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {pendingItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium text-stone-800">{item.title}</p>
                <p className="mt-0.5 text-xs text-stone-500">
                  Reviewed {item.reviewCount} time{item.reviewCount !== 1 ? 's' : ''}
                  {item.lastReviewedAt && ` \u2022 Last: ${new Date(item.lastReviewedAt).toLocaleDateString()}`}
                </p>
              </div>
              <RelevanceBadge level={item.priority} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
