'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { APFC_SYLLABUS, APFCSection, APFCTopic, APFCSubtopic } from '@/lib/syllabus/apfc-syllabus';
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  Folder,
  FileText,
  Search,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

interface SyllabusTreeViewProps {
  currentPath?: string;
}

export function SyllabusTreeView({ currentPath }: SyllabusTreeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    '1_general_english': true,
    '4_governance': true,
    '9_industrial_relations_labour_laws': true,
    '10_social_security': true
  });
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const filterText = searchQuery.toLowerCase().trim();

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-xs transition-colors">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search APFC syllabus topics (e.g. Prepositions, BRSR, Sole Negotiating Union)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 pl-10 pr-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100"
        />
      </div>

      {/* Syllabus Section Count Bar */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
        <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-amber-500" /> 13 Decoded APFC Sections
        </span>
        <span>120 Question Blueprint</span>
      </div>

      {/* Tree Hierarchy List */}
      <div className="space-y-2">
        {APFC_SYLLABUS.map((section) => {
          const isSecExpanded = Boolean(expandedSections[section.id] || filterText);
          const matchesSec = !filterText || section.title.toLowerCase().includes(filterText) || section.topics.some(t => t.title.toLowerCase().includes(filterText) || t.subtopics.some(st => st.title.toLowerCase().includes(filterText)));

          if (!matchesSec) return null;

          const isSecActive = currentPath === section.fullPath;

          return (
            <div
              key={section.id}
              className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/40 overflow-hidden"
            >
              {/* Section Row */}
              <div className="flex items-center justify-between px-3.5 py-3 hover:bg-stone-100/60 dark:hover:bg-stone-800/60 transition">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  {isSecExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  <BookOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
                </button>

                <Link
                  href={section.fullPath}
                  className={`flex-1 text-xs font-bold truncate mx-2 ${
                    isSecActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-stone-900 dark:text-stone-100 hover:text-stone-700'
                  }`}
                >
                  {section.title}
                </Link>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  {section.targetQuestions}Q
                </span>
              </div>

              {/* Topics Level */}
              {isSecExpanded && (
                <div className="border-t border-stone-200/60 dark:border-stone-800/60 pl-6 pr-3 py-2 space-y-1.5 bg-white dark:bg-stone-900">
                  {section.topics.map((topic) => {
                    const isTopExpanded = Boolean(expandedTopics[topic.id] || filterText);
                    const matchesTopic = !filterText || topic.title.toLowerCase().includes(filterText) || topic.subtopics.some(st => st.title.toLowerCase().includes(filterText));

                    if (!matchesTopic) return null;

                    const isTopActive = currentPath === topic.fullPath;

                    return (
                      <div key={topic.id} className="space-y-1">
                        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition">
                          <button
                            onClick={() => toggleTopic(topic.id)}
                            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            {isTopExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            <Folder className="h-3.5 w-3.5 text-indigo-500" />
                          </button>

                          <Link
                            href={topic.fullPath}
                            className={`flex-1 text-xs font-semibold truncate mx-2 ${
                              isTopActive
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-stone-800 dark:text-stone-200 hover:text-stone-900'
                            }`}
                          >
                            {topic.title}
                          </Link>

                          <span className="text-[10px] text-stone-400">
                            {topic.subtopics.length} subtopics
                          </span>
                        </div>

                        {/* Subtopics Level */}
                        {isTopExpanded && (
                          <div className="pl-6 space-y-1 border-l-2 border-stone-200 dark:border-stone-800 ml-3 my-1">
                            {topic.subtopics.map((subtopic) => {
                              const matchesSub = !filterText || subtopic.title.toLowerCase().includes(filterText);
                              if (!matchesSub) return null;

                              const isSubActive = currentPath === subtopic.fullPath;

                              return (
                                <Link
                                  key={subtopic.id}
                                  href={subtopic.fullPath}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                                    isSubActive
                                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold shadow-xs'
                                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900'
                                  }`}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <FileText className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                    <span className="truncate">{subtopic.title}</span>
                                  </span>
                                  <Sparkles className="h-3 w-3 text-stone-400 opacity-60 flex-shrink-0" />
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
