import { createClient } from '@libsql/client';
import fs from 'fs';
const lines = fs.readFileSync('.env', 'utf8').split('\n');
const u = lines.find(l=>l.startsWith('TURSO_URL')).split('=')[1].replace(/"/g, '').trim();
const t = lines.find(l=>l.startsWith('TURSO_AUTH_TOKEN')).split('=')[1].replace(/"/g, '').trim();
const client = createClient({ url: u, authToken: t });

const rs = await client.execute("PRAGMA table_info(error_logs)");
console.log('error_logs columns:');
rs.rows.forEach(row => console.log(`  ${row.name} (${row.type})`));

const rs2 = await client.execute("PRAGMA table_info(answer_attempts)");
console.log('\nanswer_attempts columns:');
rs2.rows.forEach(row => console.log(`  ${row.name} (${row.type})`));
