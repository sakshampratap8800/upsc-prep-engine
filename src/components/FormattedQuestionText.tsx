'use client';

import React from 'react';

interface ContentBlock {
  type: string;
  text?: string;
  label?: string;
  table_type?: string;
  title?: string;
  subtitle?: string;
  headers?: string[];
  rows?: string[][];
  asset?: string;
  alt?: string;
  caption?: string;
  items?: any[];
  context_id?: string;
  display?: string;
  value?: string;
}

interface Props {
  text: string | null | undefined;
  contentJson?: string | null;
  className?: string;
}

// Inline formatting helper for <u>...</u>, *...*, and blanks (_______)
function renderInlineFormat(textStr: string): React.ReactNode[] {
  if (!textStr) return [];
  // Split by <u>...</u>, *...*, or blanks (3+ consecutive underscores)
  const parts = textStr.split(/(<u>.*?<\/u>|\*.*?\*|_{3,})/g);

  return parts.map((part, index) => {
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      const inner = part.slice(3, -4);
      return (
        <u
          key={index}
          className="underline decoration-dashed decoration-2 underline-offset-4 font-bold decoration-indigo-600 dark:decoration-indigo-400"
        >
          {inner}
        </u>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic font-serif">
          {inner}
        </em>
      );
    }
    if (/^_{3,}$/.test(part)) {
      return (
        <span
          key={index}
          className="inline-block px-2 py-0.5 mx-1 font-mono font-bold tracking-widest text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-b-2 border-indigo-500 rounded-xs"
        >
          __________
        </span>
      );
    }
    return part;
  });
}

// Render structured table block
function renderTableBlock(block: ContentBlock, keyIdx: number) {
  if (!block.rows || block.rows.length === 0) return null;

  const isMatchingCodes = block.table_type === 'matching_codes' || (block.headers && block.headers.includes('A') && block.headers.includes('B'));
  const isMatchingList = block.table_type === 'matching_list';

  return (
    <div key={keyIdx} className="my-3 overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs">
      {(block.title || block.subtitle) && (
        <div className="bg-stone-100/80 dark:bg-stone-800/80 px-4 py-2 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between flex-wrap gap-2">
          {block.title && <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">{block.title}</span>}
          {block.subtitle && <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">{block.subtitle}</span>}
        </div>
      )}

      <table className="w-full text-left text-sm border-collapse">
        {block.headers && block.headers.length > 0 && (
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
              {block.headers.map((h, hIdx) => (
                <th
                  key={hIdx}
                  className={`px-4 py-2.5 font-mono text-xs font-bold text-stone-700 dark:text-stone-300 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                    isMatchingCodes && hIdx > 0 ? 'text-center' : ''
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {block.rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="border-b last:border-b-0 border-stone-100 dark:border-stone-800/60 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
            >
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-4 py-2.5 text-stone-800 dark:text-stone-200 border-r last:border-r-0 border-stone-100 dark:border-stone-800/60 ${
                    isMatchingCodes && cIdx === 0 ? 'font-mono font-bold text-stone-600 dark:text-stone-400 w-16 text-center' : ''
                  } ${isMatchingCodes && cIdx > 0 ? 'text-center font-mono font-bold text-indigo-700 dark:text-indigo-400' : ''} ${
                    isMatchingList ? 'w-1/2 align-top' : ''
                  }`}
                >
                  {renderInlineFormat(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type QuestionStructure =
  | {
      type: 'sentence_ordering';
      intro?: string;
      items: Array<{ label: string; text: string }>;
    }
  | {
      type: 'statements';
      intro?: string;
      items: Array<{ label: string; text: string }>;
      concludingText?: string;
    }
  | {
      type: 'numbered_list';
      intro?: string;
      items: Array<{ num: string; text: string }>;
      concludingText?: string;
    }
  | {
      type: 'plain';
      text: string;
    };

function parseQuestionStructure(rawText: string): QuestionStructure {
  if (!rawText) return { type: 'plain', text: '' };

  // 1. Sentence Ordering (S1, S6, P, Q, R, S)
  const isSentenceOrdering =
    /(?:^|\s)(?:S1|S6)\s*:\s*/i.test(rawText) && /(?:P|Q|R|S)\s*:\s*/i.test(rawText);
  if (isSentenceOrdering) {
    const regex = /(?:^|\s+)(S1|S6|[PQRS])\s*:\s*/gi;
    const markers: Array<{ label: string; index: number; length: number }> = [];
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      markers.push({
        label: match[1].toUpperCase(),
        index: match.index,
        length: match[0].length,
      });
    }

    if (markers.length >= 4) {
      const introText = rawText.slice(0, markers[0].index).trim();
      const items: Array<{ label: string; text: string }> = [];
      for (let i = 0; i < markers.length; i++) {
        const current = markers[i];
        const nextStart = i + 1 < markers.length ? markers[i + 1].index : rawText.length;
        const itemText = rawText.slice(current.index + current.length, nextStart).trim();
        items.push({
          label: current.label,
          text: itemText,
        });
      }
      return { type: 'sentence_ordering', intro: introText, items };
    }
  }

  // 2. Statements (Statement-I, Statement-II, Statement-III)
  const isStatements = /Statement\s*[-–—]?\s*(I{1,3}|IV|V|\d+)\s*:\s*/i.test(rawText);
  if (isStatements) {
    const regex = /(?:^|\s+)(Statement\s*[-–—]?\s*(?:I{1,3}|IV|V|\d+))\s*:\s*/gi;
    const markers: Array<{ label: string; index: number; length: number }> = [];
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      markers.push({
        label: match[1].trim(),
        index: match.index,
        length: match[0].length,
      });
    }

    if (markers.length >= 1) {
      const introText = rawText.slice(0, markers[0].index).trim();
      const items: Array<{ label: string; text: string }> = [];
      let concludingText = '';

      for (let i = 0; i < markers.length; i++) {
        const current = markers[i];
        const nextStart = i + 1 < markers.length ? markers[i + 1].index : rawText.length;
        let itemText = rawText.slice(current.index + current.length, nextStart).trim();

        if (i === markers.length - 1) {
          const concMatch = itemText.match(
            /(\.|\?|\n|\s{2,})\s*(Which\s+[\s\S]*|Select\s+[\s\S]*|How\s+many\s+[\s\S]*)$/i
          );
          if (concMatch && typeof concMatch.index === 'number') {
            concludingText = concMatch[2].trim();
            itemText = itemText
              .slice(0, concMatch.index + (concMatch[1] === '.' ? 1 : 0))
              .trim();
          }
        }

        items.push({
          label: current.label,
          text: itemText,
        });
      }
      return { type: 'statements', intro: introText, items, concludingText };
    }
  }

  // 3. Numbered List (1. ..., 2. ...)
  const numRegex =
    /(?:^|\s+)([1-8])\.\s+([A-Z\u00C0-\u024F"“'‘(][\s\S]*?)(?=(?:\s+[1-8]\.\s+)|(?:\s+Which\s+)|(?:\s+Select\s+)|(?:\s+How\s+many\s+)|$)/g;
  const numMatches: Array<{ num: string; text: string; index: number }> = [];
  let nm;
  while ((nm = numRegex.exec(rawText)) !== null) {
    numMatches.push({
      num: nm[1],
      text: nm[2].trim(),
      index: nm.index,
    });
  }

  if (numMatches.length >= 2 && numMatches[0].num === '1' && numMatches[1].num === '2') {
    const introText = rawText.slice(0, numMatches[0].index).trim();
    const lastMatch = numMatches[numMatches.length - 1];
    let concludingText = '';

    const concMatch = lastMatch.text.match(
      /(\.|\?|\n|\s{2,})\s*(Which\s+[\s\S]*|Select\s+[\s\S]*|How\s+many\s+[\s\S]*)$/i
    );
    if (concMatch && typeof concMatch.index === 'number') {
      concludingText = concMatch[2].trim();
      lastMatch.text = lastMatch.text
        .slice(0, concMatch.index + (concMatch[1] === '.' ? 1 : 0))
        .trim();
    }

    return {
      type: 'numbered_list',
      intro: introText,
      items: numMatches.map((m) => ({ num: m.num, text: m.text })),
      concludingText,
    };
  }

  return { type: 'plain', text: rawText };
}

export function FormattedQuestionText({ text, contentJson, className = '' }: Props) {
  // ── Render Structured Block Content (If contentJson exists) ──────────
  if (contentJson) {
    try {
      const blocks: ContentBlock[] = JSON.parse(contentJson);
      if (Array.isArray(blocks) && blocks.length > 0) {
        return (
          <div className={`space-y-3 ${className}`}>
            {blocks.map((block, idx) => {
              if ((block.type === 'text' || block.type === 'sentence') && block.text) {
                const effectiveText =
                  idx === 0 &&
                  text &&
                  (text.includes('<u>') || text.includes('___') || text.includes('*')) &&
                  !block.text.includes('<u>') &&
                  !block.text.includes('*')
                    ? text
                    : block.text;
                return (
                  <div key={idx} className="leading-relaxed">
                    {renderInlineFormat(effectiveText)}
                  </div>
                );
              }
              if (block.type === 'table') {
                return renderTableBlock(block, idx);
              }
              // ── statement_list / numbered_list / ordered_list / numbered_text — numbered items
              if (
                (block.type === 'statement_list' ||
                  block.type === 'numbered_list' ||
                  block.type === 'ordered_list' ||
                  block.type === 'numbered_text') &&
                Array.isArray(block.items)
              ) {
                return (
                  <div key={idx} className="space-y-2 my-3">
                    {block.items.map((item: any, itemIdx: number) => {
                      const num = item.number ?? item.num ?? itemIdx + 1;
                      const txt = typeof item === 'string' ? item : item.text;
                      return (
                        <div key={itemIdx} className="flex items-start gap-3">
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-800 text-xs font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                            {num}
                          </span>
                          <div className="flex-1 text-sm md:text-base leading-relaxed text-stone-800 dark:text-stone-200">
                            {renderInlineFormat(txt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // ── assertion + reason — Statement (I) / Statement (II) pair
              if ((block.type === 'assertion' || block.type === 'reason') && block.text) {
                const isAssertion = block.type === 'assertion';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xs my-1 ${
                      isAssertion
                        ? 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20'
                        : 'border-violet-200 dark:border-violet-800/60 bg-violet-50/30 dark:bg-violet-950/15'
                    }`}
                  >
                    <span
                      className={`inline-flex shrink-0 items-center justify-center rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white ${
                        isAssertion ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-violet-600 dark:bg-violet-500'
                      }`}
                    >
                      {block.label || (isAssertion ? 'Statement I' : 'Statement II')}
                    </span>
                    <div className="flex-1 text-sm md:text-base leading-relaxed text-stone-900 dark:text-stone-100 font-serif pt-0.5">
                      {renderInlineFormat(block.text)}
                    </div>
                  </div>
                );
              }

              // ── labeled_fragments / target_list — labeled items (P/Q/R/S or i/ii/iii)
              if (
                (block.type === 'labeled_fragments' || block.type === 'target_list') &&
                Array.isArray(block.items)
              ) {
                return (
                  <div key={idx} className="space-y-2 my-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 p-3">
                    {block.items.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="flex items-start gap-3">
                        <span className="inline-flex h-6 min-w-[1.75rem] shrink-0 items-center justify-center rounded-lg bg-stone-200 dark:bg-stone-800 text-xs font-mono font-bold text-stone-800 dark:text-stone-200 mt-0.5 px-1.5">
                          {item.label ?? itemIdx + 1}
                        </span>
                        <div className="flex-1 text-sm md:text-base leading-relaxed text-stone-800 dark:text-stone-200">
                          {renderInlineFormat(typeof item === 'string' ? item : item.text)}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              // ── given_data — list of plain string data items (math/geometry)
              if (block.type === 'given_data' && Array.isArray(block.items)) {
                return (
                  <div key={idx} className="my-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-2">Given Data</p>
                    <ul className="space-y-1 font-mono text-sm text-stone-800 dark:text-stone-200">
                      {block.items.map((item: any, itemIdx: number) => (
                        <li key={itemIdx} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          {typeof item === 'string' ? item : item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              // ── data_list — label: value pairs (accounting/finance data)
              if (block.type === 'data_list' && Array.isArray(block.items)) {
                return (
                  <div key={idx} className="my-3 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
                    <table className="w-full text-sm">
                      <tbody>
                        {block.items.map((item: any, itemIdx: number) => (
                          <tr key={itemIdx} className="border-b last:border-b-0 border-stone-100 dark:border-stone-800">
                            <td className="px-4 py-2 font-medium text-stone-700 dark:text-stone-300 w-2/3">
                              {renderInlineFormat(item.label)}
                            </td>
                            <td className="px-4 py-2 font-mono font-bold text-indigo-700 dark:text-indigo-400 text-right">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              // ── context_reference — skip silently (passage handled separately outside)
              if (block.type === 'context_reference') {
                return null;
              }

              // ── options — skip (rendered by the parent answer component)
              if (block.type === 'options') {
                return null;
              }

              if (block.type === 'image' && block.asset) {
                const imgPath = block.asset.startsWith('/') ? block.asset : `/pyq-images/${block.asset}`;
                return (
                  <div key={idx} className="my-4 flex flex-col items-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4">
                    <img
                      src={imgPath}
                      alt={block.alt || 'Question Diagram'}
                      className="max-h-80 w-auto object-contain rounded-xl shadow-xs"
                    />
                    {block.caption && (
                      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400 italic text-center">
                        {block.caption}
                      </p>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        );
      }
    } catch {
      // Fallback to text parsing if JSON parse fails
    }
  }

  if (!text) return null;

  const parsed = parseQuestionStructure(text);

  // ── Render Sentence Ordering (S1, S6, P, Q, R, S) ─────────────────────
  if (parsed.type === 'sentence_ordering') {
    return (
      <div className={`space-y-3 ${className}`}>
        {parsed.intro && (
          <p className="font-semibold text-stone-900 dark:text-stone-100">
            {renderInlineFormat(parsed.intro)}
          </p>
        )}

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-4 space-y-2.5 shadow-2xs font-serif">
          {parsed.items.map((item, idx) => {
            const isFixedBoundary = item.label === 'S1' || item.label === 'S6';
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
                  isFixedBoundary
                    ? 'bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 font-semibold'
                    : 'bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <span
                  className={`inline-flex h-6 min-w-[2.25rem] shrink-0 items-center justify-center rounded-lg px-2 text-xs font-mono font-bold ${
                    isFixedBoundary
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  {item.label} :
                </span>
                <div className="flex-1 text-sm md:text-base leading-relaxed text-stone-900 dark:text-stone-100 pt-0.5">
                  {renderInlineFormat(item.text)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Render Statement Questions (Statement-I, II, III) ────────────────
  if (parsed.type === 'statements') {
    return (
      <div className={`space-y-3 ${className}`}>
        {parsed.intro && (
          <p className="font-semibold text-stone-900 dark:text-stone-100">
            {renderInlineFormat(parsed.intro)}
          </p>
        )}

        <div className="space-y-2.5 my-3">
          {parsed.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 shadow-2xs"
            >
              <span className="inline-flex h-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white px-2.5 text-xs font-mono font-bold">
                {item.label}
              </span>
              <div className="flex-1 text-sm md:text-base leading-relaxed text-stone-900 dark:text-stone-100 font-serif pt-0.5">
                {renderInlineFormat(item.text)}
              </div>
            </div>
          ))}
        </div>

        {parsed.concludingText && (
          <p className="font-medium text-stone-900 dark:text-stone-100 pt-1">
            {renderInlineFormat(parsed.concludingText)}
          </p>
        )}
      </div>
    );
  }

  // ── Render Numbered List Questions (1., 2., 3.) ─────────────────────
  if (parsed.type === 'numbered_list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {parsed.intro && (
          <p className="font-semibold text-stone-900 dark:text-stone-100">
            {renderInlineFormat(parsed.intro)}
          </p>
        )}

        <div className="space-y-2 my-3 pl-1">
          {parsed.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-800 text-xs font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {item.num}
              </span>
              <div className="flex-1 text-sm md:text-base leading-relaxed text-stone-800 dark:text-stone-200">
                {renderInlineFormat(item.text)}
              </div>
            </div>
          ))}
        </div>

        {parsed.concludingText && (
          <p className="font-medium text-stone-900 dark:text-stone-100 pt-1">
            {renderInlineFormat(parsed.concludingText)}
          </p>
        )}
      </div>
    );
  }

  // ── Fallback Plain Text ────────────────────────────────────────────────
  return (
    <div className={`whitespace-pre-line leading-relaxed ${className}`}>
      {renderInlineFormat(parsed.text)}
    </div>
  );
}
