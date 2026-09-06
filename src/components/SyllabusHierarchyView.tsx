'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  ExternalLink,
  Copy,
  Check,
  FileQuestion,
} from 'lucide-react';

interface SubTopic {
  id: number;
  name: string;
  paper: string;
  _count?: { pyqs: number };
}

interface ParentTopic {
  id: number;
  name: string;
  paper: string;
  description: string | null;
  children: SubTopic[];
  _count: { pyqs: number };
}

interface SyllabusHierarchyViewProps {
  initialTopics: ParentTopic[];
}

interface ParsedAlphaItem {
  label: string;
  text: string;
}

interface ParsedRomanSection {
  roman: string;
  title: string;
  items: ParsedAlphaItem[];
}

interface ParsedTopicStructure {
  type: 'roman_sections' | 'alpha_items' | 'semicolon_list' | 'simple';
  title: string;
  hasSubContent: boolean;
  sections?: ParsedRomanSection[];
  items?: ParsedAlphaItem[];
}

export function parseSyllabusString(text: string): ParsedTopicStructure {
  const trimmed = text.trim();

  // 1. Check for Roman numeral subsections: (i), (ii), (iii)...
  const romanPattern = /\(((?:i|ii|iii|iv|v|vi|vii|viii|ix|x))\)\s+/i;
  if (romanPattern.test(trimmed)) {
    const firstRomanIdx = trimmed.search(/\(((?:i|ii|iii|iv|v|vi|vii|viii|ix|x))\)/i);
    const mainTitle = trimmed.slice(0, firstRomanIdx).replace(/[:\s]+$/, '').trim();
    const rest = trimmed.slice(firstRomanIdx);

    const sectionSplitRegex = /\(((?:i|ii|iii|iv|v|vi|vii|viii|ix|x))\)\s+/gi;
    let match;
    const indices: Array<{ roman: string; index: number; fullMatch: string }> = [];
    while ((match = sectionSplitRegex.exec(rest)) !== null) {
      indices.push({ roman: match[1], index: match.index, fullMatch: match[0] });
    }

    const sections: ParsedRomanSection[] = [];
    for (let i = 0; i < indices.length; i++) {
      const start = indices[i].index + indices[i].fullMatch.length;
      const end = i + 1 < indices.length ? indices[i + 1].index : rest.length;
      const secContent = rest.slice(start, end).trim();

      const colonIdx = secContent.indexOf(':');
      let secTitle = secContent;
      let alphaPart = '';
      if (colonIdx !== -1) {
        secTitle = secContent.slice(0, colonIdx).trim();
        alphaPart = secContent.slice(colonIdx + 1).trim();
      }

      const alphaItems = parseAlphaItems(alphaPart || secContent);
      sections.push({
        roman: indices[i].roman,
        title: secTitle,
        items: alphaItems.length > 0 ? alphaItems : [{ label: '•', text: secContent }],
      });
    }

    return {
      type: 'roman_sections',
      title: mainTitle,
      hasSubContent: sections.length > 0,
      sections,
    };
  }

  // 2. Check for alphabetical subtopics: (a), (b), (c)...
  const alphaItems = parseAlphaItems(trimmed);
  if (alphaItems.length > 1) {
    const firstAlphaIdx = trimmed.search(/\([a-z]\)/i);
    let title = trimmed;
    if (firstAlphaIdx !== -1) {
      title = trimmed.slice(0, firstAlphaIdx).replace(/[:\s]+$/, '').trim();
    }
    return {
      type: 'alpha_items',
      title: title || trimmed,
      hasSubContent: true,
      items: alphaItems,
    };
  }

  // 3. Check for Colon with semicolon-separated list (e.g. GS-IV Ethics topics)
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx > 0 && colonIdx < 70) {
    const title = trimmed.slice(0, colonIdx).trim();
    const body = trimmed.slice(colonIdx + 1).trim();
    const semiParts = body.split(';').map((s) => s.trim()).filter(Boolean);
    if (semiParts.length > 1) {
      return {
        type: 'semicolon_list',
        title,
        hasSubContent: true,
        items: semiParts.map((s) => ({ label: '•', text: s })),
      };
    }
  }

  // 4. Default simple topic (e.g. Prelims, GS statements)
  return {
    type: 'simple',
    title: trimmed,
    hasSubContent: false,
    items: [],
  };
}

function parseAlphaItems(str: string): ParsedAlphaItem[] {
  const alphaRegex = /\(([a-z])\)\s+/gi;
  let match;
  const indices: Array<{ label: string; index: number; fullMatch: string }> = [];
  while ((match = alphaRegex.exec(str)) !== null) {
    indices.push({ label: match[1], index: match.index, fullMatch: match[0] });
  }
  if (indices.length === 0) return [];

  const items: ParsedAlphaItem[] = [];
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].index + indices[i].fullMatch.length;
    const end = i + 1 < indices.length ? indices[i + 1].index : str.length;
    const itemText = str.slice(start, end).trim();
    items.push({
      label: `(${indices[i].label})`,
      text: itemText,
    });
  }
  return items;
}

export function SyllabusHierarchyView({ initialTopics }: SyllabusHierarchyViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Collect available filter tabs
  const filterTabs = useMemo(() => {
    return ['ALL', 'Prelims', 'GS-I', 'GS-II', 'GS-III', 'GS-IV', 'Essay', 'Sociology Paper-I', 'Sociology Paper-II'];
  }, []);

  // Filter topics based on active tab and search query
  const filteredParents = useMemo(() => {
    return initialTopics
      .filter((parent) => {
        if (selectedFilter === 'ALL') return true;
        if (selectedFilter === 'Sociology Paper-I') return parent.name === 'Sociology Paper-I';
        if (selectedFilter === 'Sociology Paper-II') return parent.name === 'Sociology Paper-II';
        if (selectedFilter === 'Prelims') return parent.paper === 'Prelims';
        return parent.paper === selectedFilter;
      })
      .map((parent) => {
        if (!searchQuery.trim()) return parent;

        const q = searchQuery.toLowerCase();
        const matchesParent = parent.name.toLowerCase().includes(q) || (parent.description && parent.description.toLowerCase().includes(q));
        const matchedChildren = parent.children.filter((c) => c.name.toLowerCase().includes(q));

        if (matchesParent) return parent;
        if (matchedChildren.length > 0) {
          return { ...parent, children: matchedChildren };
        }
        return null;
      })
      .filter(Boolean) as ParentTopic[];
  }, [initialTopics, selectedFilter, searchQuery]);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search syllabus by topic, thinkers, keywords (e.g., Karl Marx, Preamble, Disaster)..."
              className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 py-2.5 pl-10 pr-4 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white dark:focus:bg-stone-800 focus:outline-hidden transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              {filteredParents.reduce((acc, p) => acc + p.children.length, 0)} Topics
            </span>
          </div>
        </div>

        {/* Paper Filter Tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-stone-100 dark:border-stone-800 pt-3">
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Syllabus Content List */}
      <div className="space-y-8">
        {filteredParents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 p-12 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-700" />
            <h3 className="mt-3 font-semibold text-stone-700 dark:text-stone-300">No syllabus topics found</h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Try changing your search query or paper filter.</p>
          </div>
        ) : (
          filteredParents.map((parent) => (
            <div key={parent.id} className="space-y-4">
              {/* Paper / Parent Heading */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg bg-stone-900 dark:bg-stone-100 px-2.5 py-1 text-xs font-bold text-white dark:text-stone-900">
                    {parent.paper}
                  </span>
                  <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
                    {parent.name}
                  </h2>
                </div>
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  {parent.children.length} {parent.children.length === 1 ? 'Topic' : 'Topics'}
                </span>
              </div>

              {/* Topics Grid */}
              <div className="space-y-3">
                {parent.children.map((child, idx) => {
                  const parsed = parseSyllabusString(child.name);

                  // CASE A: Topic has NO subsections (Simple topic like Prelims, GS points)
                  // Render sleek single card matching the exact grey header bar aesthetic
                  if (!parsed.hasSubContent) {
                    return (
                      <div
                        key={child.id}
                        className="group flex items-start justify-between gap-3 rounded-xl border border-stone-300/80 dark:border-stone-600/80 bg-[#d6d3d1] dark:bg-[#525252] p-3.5 sm:p-4 shadow-xs hover:opacity-95 transition"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1c1917] dark:bg-[#171717] text-[11px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-bold text-stone-900 dark:text-white leading-relaxed pt-0.5">
                            {parsed.title}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <button
                            onClick={() => copyToClipboard(child.name, child.id)}
                            title="Copy topic text"
                            className="rounded-lg p-1.5 text-stone-700 dark:text-stone-300 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                          >
                            {copiedId === child.id ? (
                              <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>

                          {child._count && child._count.pyqs > 0 ? (
                            <Link
                              href={`/pyq?topicId=${child.id}`}
                              title={`View all ${child._count.pyqs} mapped PYQs for this topic`}
                              className="flex items-center gap-1.5 rounded-lg bg-[#1c1917] dark:bg-[#171717] text-white px-2.5 py-1 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-black transition shadow-xs"
                            >
                              <FileQuestion className="h-3.5 w-3.5 text-amber-400" />
                              <span>{child._count.pyqs} {child._count.pyqs === 1 ? 'PYQ' : 'PYQs'}</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/search?q=${encodeURIComponent(parsed.title.replace(/^\d+\.\s*/, '').slice(0, 80))}`}
                              title="Search PYQs and Books for this topic"
                              className="flex items-center gap-1.5 rounded-lg bg-[#1c1917] dark:bg-[#171717] text-white px-2.5 py-1 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-black transition shadow-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="hidden sm:inline">Search PYQs</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // CASE B: Topic HAS subsections / subtopics (e.g. Sociology with (a), (b), (c))
                  return (
                    <div
                      key={child.id}
                      className="group rounded-xl border border-stone-300/80 dark:border-stone-700 bg-[#171717] dark:bg-[#121212] shadow-xs hover:border-stone-400 dark:hover:border-stone-600 transition overflow-hidden"
                    >
                      {/* Topic Card Header - Exact same Grey Bar Style */}
                      <div className="flex items-start justify-between gap-3 p-3.5 sm:p-4 bg-[#d6d3d1] dark:bg-[#525252] border-b border-stone-300 dark:border-stone-600">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1c1917] dark:bg-[#171717] text-[11px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white leading-snug pt-0.5">
                            {parsed.title}
                          </h3>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyToClipboard(child.name, child.id)}
                            title="Copy topic text"
                            className="rounded-lg p-1.5 text-stone-700 dark:text-stone-300 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                          >
                            {copiedId === child.id ? (
                              <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>

                          {child._count && child._count.pyqs > 0 ? (
                            <Link
                              href={`/pyq?topicId=${child.id}`}
                              title={`View all ${child._count.pyqs} mapped PYQs for this topic`}
                              className="flex items-center gap-1.5 rounded-lg bg-[#1c1917] dark:bg-[#171717] text-white px-2.5 py-1 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-black transition shadow-xs"
                            >
                              <FileQuestion className="h-3.5 w-3.5 text-amber-400" />
                              <span>{child._count.pyqs} {child._count.pyqs === 1 ? 'PYQ' : 'PYQs'}</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/search?q=${encodeURIComponent(parsed.title.replace(/^\d+\.\s*/, '').slice(0, 80))}`}
                              title="Search PYQs and Books for this topic"
                              className="flex items-center gap-1.5 rounded-lg bg-[#1c1917] dark:bg-[#171717] text-white px-2.5 py-1 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-black transition shadow-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="hidden sm:inline">Search PYQs</span>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Structured Subtopics Breakdown */}
                      <div className="p-4 sm:p-4.5 bg-stone-50 dark:bg-[#121212]">
                        {/* Alphabetical Subtopics (a), (b), (c)... */}
                        {parsed.type === 'alpha_items' && parsed.items && (
                          <div className="space-y-2">
                            {parsed.items.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="flex items-start gap-3 rounded-lg border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-[#1c1917]/70 p-2.5 sm:p-3 hover:bg-stone-100/80 dark:hover:bg-[#262626] transition"
                              >
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/60 px-1 text-[11px] font-bold text-amber-900 dark:text-amber-300 shrink-0">
                                  {item.label}
                                </span>
                                <div className="flex-1 text-xs sm:text-sm leading-relaxed text-stone-900 dark:text-stone-200">
                                  {item.text}
                                </div>
                                <Link
                                  href={`/search?q=${encodeURIComponent(item.text.slice(0, 60))}`}
                                  title="Find PYQs for this specific point"
                                  className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 p-1 shrink-0"
                                >
                                  <Search className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Nested Roman Numeral Sections (i), (ii) + (a), (b), (c)... */}
                        {parsed.type === 'roman_sections' && parsed.sections && (
                          <div className="space-y-3.5">
                            {parsed.sections.map((sec, secIdx) => (
                              <div
                                key={secIdx}
                                className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1c1917]/50 p-3 sm:p-3.5 space-y-2.5"
                              >
                                {/* Section Header */}
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-stone-200 dark:bg-stone-800 px-1.5 text-[11px] font-bold uppercase text-stone-800 dark:text-stone-200">
                                    ({sec.roman})
                                  </span>
                                  <h4 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                                    {sec.title}
                                  </h4>
                                </div>

                                {/* Sub-items */}
                                <div className="space-y-1.5 pl-2 sm:pl-3 border-l-2 border-stone-300 dark:border-stone-700">
                                  {sec.items.map((subItem, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="flex items-start gap-2.5 rounded-md bg-stone-50 dark:bg-[#171717] border border-stone-200 dark:border-stone-800 p-2 text-xs sm:text-sm text-stone-900 dark:text-stone-200"
                                    >
                                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold text-xs shrink-0">
                                        {subItem.label}
                                      </span>
                                      <span className="flex-1 leading-relaxed">{subItem.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Semicolon List (GS Papers) */}
                        {parsed.type === 'semicolon_list' && parsed.items && (
                          <div className="space-y-2">
                            {parsed.items.map((item, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-start gap-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1c1917]/60 p-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-200"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-stone-500 dark:bg-stone-400 shrink-0" />
                                <span className="flex-1 leading-relaxed">{item.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
