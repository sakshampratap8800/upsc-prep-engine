const fs = require('fs');
let c = fs.readFileSync('azure-workers/src/functions/aiQueueWorker.ts', 'utf8');

// ─── 1. Replace prompt block using markers ───
const startMarker = "    const systemPrompt = `You are an expert UPSC CSE";
const endMarker = "- Complete Chapter Content: ${chapter.content || chapter.summary || ''}`;";

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.log('FAILED: Could not find markers. startIdx=' + startIdx + ' endIdx=' + endIdx);
    process.exit(1);
}

const endOfEnd = endIdx + endMarker.length;

const newPromptBlock = `    const subjectHints: Record<string, string> = {
        'Geography': \`SUBJECT-SPECIFIC FOCUS (Geography):
- Pay special attention to locational facts (latitudes, longitudes, boundaries, passes, rivers) that UPSC uses in map-based MCQs.
- Flag outdated Census/population data — NCERT uses 2011 Census; provide current estimates where available.
- Identify physical vs human geography angles. UPSC often merges both in a single question.
- For climate/weather chapters: highlight El Nino, La Nina, Indian monsoon mechanism — these are perennial favorites.
- mapWork field is CRITICAL for Geography — list at least 8-10 specific locations, rivers, mountain passes, or physical features.\`,

        'History': \`SUBJECT-SPECIFIC FOCUS (History):
- Focus on chronology, cause-effect chains, and the "why" behind events — UPSC tests reasoning, not rote dates.
- For Modern History: identify freedom movement phases, key personalities, and their ideological positions.
- For Ancient/Medieval: focus on cultural contributions, administrative systems, and religious movements.
- UPSC loves "Which of the following statements is/are correct?" — extract statements that can be twisted into wrong options.
- mapWork: identify historical sites, battle locations, trade routes, and important archaeological sites.\`,

        'Politics': \`SUBJECT-SPECIFIC FOCUS (Polity/Political Science):
- Extract exact Article numbers, Amendment numbers, and Schedule references — UPSC tests precise constitutional knowledge.
- Flag any constitutional amendments that happened AFTER the NCERT was published (post-2019 especially: Article 370, 103rd Amendment for EWS, etc.).
- Differentiate between Fundamental Rights, DPSP, and Fundamental Duties — UPSC constantly mixes these up in options.
- For federalism/governance chapters: link to recent Supreme Court judgments and government schemes.
- mapWork is less relevant here — focus more on institutional comparisons and flowcharts in diagramsToDraw.\`,

        'Economics': \`SUBJECT-SPECIFIC FOCUS (Economics):
- NCERT economics data is HEAVILY outdated. Flag ALL statistics: GDP figures, poverty ratios, tax revenue, trade data, etc.
- Provide current data from Economic Survey 2024-25, Union Budget 2025-26, or RBI reports where available.
- Format updates as: "NCERT states: X (year) → Updated: Y (2024/2025 source)".
- For macro chapters: link to current monetary policy (repo rate, CRR), fiscal deficit targets, and inflation data.
- For development chapters: reference latest HDI rankings, SDG progress, and Multidimensional Poverty Index.
- diagramsToDraw: include demand-supply curves, circular flow models, budget pie charts.\`,

        'Science': \`SUBJECT-SPECIFIC FOCUS (Science):
- Extract facts relevant to UPSC Environment & Ecology (GS-3) and Science & Technology sections.
- For biology chapters: focus on biodiversity, conservation, diseases, and biotechnology applications.
- For physics/chemistry: focus on practical applications that appear in UPSC (nuclear energy, space tech, nano-technology).
- Link to recent scientific developments: ISRO missions, indigenous technology, health schemes.
- Identify concepts that overlap with Environment (climate change, pollution, renewable energy).\`,

        'Sociology': \`SUBJECT-SPECIFIC FOCUS (Sociology):
- Extract thinkers and their theories with precise attribution — UPSC Optional Paper tests exact names and concepts.
- Identify Indian society themes: caste, tribe, gender, religion, regionalism — these appear in both GS-1 and Optional.
- Flag outdated social data (literacy rates, sex ratio, urbanization %) and provide latest Census/NFHS-5 data.
- For social movements: chronology, leaders, and outcomes are critical.
- crossLinkages to Polity (constitutional provisions for social justice) and Economics (poverty, inequality) are very important.\`
    };

    const subjectKey = (chapter.subjectName as string) || '';
    const subjectInstruction = subjectHints[subjectKey] || '';

    const systemPrompt = \`You are a senior UPSC CSE (Civil Services Exam) faculty with 15+ years of experience coaching toppers. You specialize in \${subjectKey || 'General Studies'}.

TASK: Analyze the given NCERT chapter exhaustively for UPSC CSE 2027 (Prelims + Mains).

CRITICAL DATA RULES:
1. NCERT textbooks contain outdated statistics (2011 Census, old GDP, pre-2014 policies). For EVERY data point or statistic:
   - If updated data exists, provide BOTH: "NCERT states: X (year) → Updated: Y (latest source)".
   - If no update exists, keep the original data as-is.
2. DEPTH: Provide at least 8 items for highYieldSummary, 6 for prelimsFocus, 4 for mainsAngles, 5 for caseStudiesAndData.
3. PRELIMS: Extract specific facts, dates, names, and tricky statements UPSC loves to twist into wrong MCQ options.
4. MAINS: Frame questions using UPSC directive words (Discuss, Critically Analyze, Examine, Comment). Include a brief answer framework.
5. CROSS-LINKAGES: Identify connections to other UPSC subjects (e.g., Geography linking to Economy or Environment).

\${subjectInstruction}

Return ONLY valid JSON matching this schema:
{
  "relevance": "string (which GS paper this maps to, e.g. 'GS-1: Indian Geography, GS-3: Environment')",
  "highYieldSummary": ["string (key takeaways most likely to be tested)"],
  "prelimsFocus": ["string (specific facts, traps, commonly twisted statements for MCQs)"],
  "mainsAngles": [{"question": "string (framed like actual UPSC question with directive word)", "framework": "string (brief answer structure)"}],
  "caseStudiesAndData": ["string (important data — flag outdated NCERT data with current updates where available)"],
  "keyDefinitions": [{"term": "string", "definition": "string (concise, exam-ready)"}],
  "crossLinkages": ["string (connections to other UPSC subjects/topics)"],
  "mapWork": ["string (places, rivers, boundaries, features to locate on map)"],
  "diagramsToDraw": ["string (flowcharts, concept maps, comparison tables worth drawing)"]
}\`;

    const userPrompt = \`Analyze this NCERT chapter in full depth for UPSC CSE 2027:
- Subject: \${chapter.subjectName} | Book: \${chapter.bookTitle} (Class \${chapter.className}) | Chapter \${chapter.number}: \${chapter.chapterTitle}
- Complete Chapter Content: \${chapter.content || chapter.summary || ''}\`;`;

c = c.substring(0, startIdx) + newPromptBlock + c.substring(endOfEnd);

// ─── 2. Add crossLinkages to DB save ───
c = c.replace(
    "diagramsToDraw: parsedData.diagramsToDraw || [],\r\n                relevance:",
    "diagramsToDraw: parsedData.diagramsToDraw || [],\r\n                crossLinkages: parsedData.crossLinkages || [],\r\n                relevance:"
);
// Also try LF-only version
c = c.replace(
    "diagramsToDraw: parsedData.diagramsToDraw || [],\n                relevance:",
    "diagramsToDraw: parsedData.diagramsToDraw || [],\n                crossLinkages: parsedData.crossLinkages || [],\n                relevance:"
);

fs.writeFileSync('azure-workers/src/functions/aiQueueWorker.ts', c);
console.log('DONE: Prompt replaced and crossLinkages added to DB save.');
