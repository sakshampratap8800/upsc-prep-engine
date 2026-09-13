const fs = require('fs');
let content = fs.readFileSync('azure-workers/src/functions/aiQueueWorker.ts', 'utf8');

// 1. Exponential backoff
content = content.replace(
    /if \(res\.status === 503\) await new Promise\(r => setTimeout\(r, 1200\)\);\r?\n\s*\} catch \(e\) \{ \}/,
    `if (res.status === 503 || res.status === 429) {
                        const backoff = Math.pow(2, attempt) * 1000;
                        context.log(\`Gemini overloaded (\${res.status}), retrying in \${backoff}ms...\`);
                        await new Promise(r => setTimeout(r, backoff));
                    }
                } catch (e) {
                    context.log('Fetch error:', e);
                }`
);

// 2. Try Catch & DB Updates for handleAnalyzeChapter
let fnStart = content.indexOf('async function handleAnalyzeChapter');
let fnEnd = content.indexOf('async function handleGeneratePYQs');
let fnBody = content.substring(fnStart, fnEnd);

fnBody = fnBody.replace(
    'context.log(`Running Analyze Chapter for ID ${chapterId}`);',
    'context.log(`Running Analyze Chapter for ID ${chapterId}`);\n    try {\n        await db.execute({ sql: `UPDATE chapters SET analyzeStatus = \'processing\', analyzeError = NULL WHERE id = ?`, args: [chapterId] });'
);

const endTargetWindows = 'context.log(\'Saved analyze chapter results.\');\r\n}';
const endTargetUnix = 'context.log(\'Saved analyze chapter results.\');\n}';
const replacement = 'await db.execute({ sql: `UPDATE chapters SET analyzeStatus = \'completed\' WHERE id = ?`, args: [chapterId] });\n        context.log(\'Saved analyze chapter results.\');\n    } catch (err: any) {\n        const errorMsg = err.message || \'Unknown error during analysis\';\n        context.log(`Analyze Chapter failed for ID ${chapterId}: ${errorMsg}`);\n        await db.execute({ sql: `UPDATE chapters SET analyzeStatus = \'failed\', analyzeError = ? WHERE id = ?`, args: [errorMsg, chapterId] });\n        throw err;\n    }\n}';

if (fnBody.includes(endTargetWindows)) {
    fnBody = fnBody.replace(endTargetWindows, replacement);
} else {
    fnBody = fnBody.replace(endTargetUnix, replacement);
}

content = content.substring(0, fnStart) + fnBody + content.substring(fnEnd);
fs.writeFileSync('azure-workers/src/functions/aiQueueWorker.ts', content);
