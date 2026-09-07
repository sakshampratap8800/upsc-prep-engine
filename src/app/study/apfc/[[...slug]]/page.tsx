import React from 'react';
import { Metadata } from 'next';
import { getAPFCNodeByPath, APFC_SYLLABUS } from '@/lib/syllabus/apfc-syllabus';
import { getRelevantPYQsForTopic } from '@/lib/study/pyq-retriever';
import { StudyTopicPage } from '@/components/study/StudyTopicPage';
import { SyllabusTreeView } from '@/components/study/SyllabusTreeView';
import { PageHeader } from '@/components/PageHeader';
import { Sparkles, BookOpen, GraduationCap, Award, CheckCircle2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slugs = resolvedParams.slug || [];
  const node = getAPFCNodeByPath(slugs);

  const title = node.subtopic?.title || node.topic?.title || node.section?.title || 'Study APFC Syllabus';

  return {
    title: `${title} | UPSC EPFO APFC Prep Engine`,
    description: node.subtopic?.oneLiner || node.topic?.oneLiner || node.section?.oneLiner || 'Complete UPSC EPFO APFC syllabus topic-by-topic study system.',
  };
}

export default async function APFCStudyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slugs = resolvedParams.slug || [];
  const node = getAPFCNodeByPath(slugs);

  // If root /study/apfc
  if (node.level === 'root') {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <PageHeader
          title="Study APFC — Topic-by-Topic Syllabus Hub"
          description="Explore the complete 13-section decoded UPSC EPFO APFC syllabus. Click any section, topic, or subtopic to access focused AI lessons and historical PYQs."
          breadcrumbs={[{ label: 'Study APFC', href: '/study/apfc' }]}
        />

        {/* Top Summary Banner */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs transition-colors space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 dark:bg-stone-100 px-2.5 py-1 text-xs font-bold text-white dark:text-stone-900">
                  <Award className="h-3.5 w-3.5 text-amber-300 dark:text-amber-500" /> EPFO APFC 2026
                </span>
                <span className="text-xs font-semibold text-stone-500">120 Questions • 300 Marks</span>
              </div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                13 Decoded Syllabus Sections
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-3.5 py-2 rounded-xl">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>AI Models: Nemotron 3.5 Lightning 30B & 120B</span>
            </div>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Select any subtopic from the hierarchy below to open its dedicated study page. Every topic includes core concepts, distractor warnings, matched historical PYQs, and an automated AI Teacher.
          </p>
        </div>

        {/* 13-Section Interactive Syllabus Tree Component */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SyllabusTreeView />
          </div>

          {/* Right Sidebar Info Card */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-amber-500" /> 2026 Syllabus Rules
              </h3>
              <ul className="space-y-2 text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Governance:</strong> Strictly ESG, Board Oversight, Internal Controls, Whistleblower Protections, and Board Diversity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Labour Laws & Social Security:</strong> Kept in separate modules matching the statutory codes (IRC 2020, Social Security Code 2020).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Accountancy & Insurance:</strong> Covers Ind AS 115, Ind AS 36, Statutory Audit, IRDAI Solvency 150% threshold, and Uberrimae Fidei.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Topic or Subtopic or Section Level
  const currentTitle = node.subtopic?.title || node.topic?.title || node.section?.title || 'APFC Study';
  const currentOneLiner = node.subtopic?.oneLiner || node.topic?.oneLiner || node.section?.oneLiner || '';
  const sectionName = node.section?.title || 'APFC Syllabus';

  const keyConcepts = node.subtopic?.keyConcepts || [];
  const importantPoints = node.subtopic?.importantPoints || [];
  const pyqKeywords = node.subtopic?.pyqKeywords || node.topic?.slug.split('-') || [];

  // Build list of subtopics if at section or topic level
  let subtopicsList: Array<{ title: string; fullPath: string; oneLiner: string }> = [];
  if (node.level === 'section' && node.section) {
    node.section.topics.forEach(t => {
      t.subtopics.forEach(st => {
        subtopicsList.push({ title: st.title, fullPath: st.fullPath, oneLiner: st.oneLiner });
      });
    });
  } else if (node.level === 'topic' && node.topic) {
    subtopicsList = node.topic.subtopics.map(st => ({ title: st.title, fullPath: st.fullPath, oneLiner: st.oneLiner }));
  }

  // Retrieve relevant PYQs from Turso DB
  const pyqs = await getRelevantPYQsForTopic(pyqKeywords, node.section?.slug, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
      {/* Left Sidebar Tree Navigation */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="sticky top-6">
          <SyllabusTreeView currentPath={`/study/apfc/${slugs.join('/')}`} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3">
        <StudyTopicPage
          slugs={slugs}
          title={currentTitle}
          oneLiner={currentOneLiner}
          sectionName={sectionName}
          breadcrumb={node.breadcrumb}
          keyConcepts={keyConcepts}
          importantPoints={importantPoints}
          pyqKeywords={pyqKeywords}
          subtopicsList={subtopicsList}
          pyqs={pyqs}
        />
      </div>
    </div>
  );
}
