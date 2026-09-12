import { createClient } from '@libsql/client';
import { aiQueueWorker } from './azure-workers/src/functions/aiQueueWorker';

const dbUrl = process.env.TURSO_URL.replace('libsql://', 'https://');
const dbToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url: dbUrl, authToken: dbToken });

const context = {
    log: (...args: any[]) => console.log(...args)
};

async function main() {
    try {
        console.log("Starting analyze chapter 136...");
        await aiQueueWorker({ chapterId: 136, task: 'analyze_chapter' }, context as any);
        console.log("Success!");
    } catch (e) {
        console.error("Worker threw an error:", e);
    }
}
main();