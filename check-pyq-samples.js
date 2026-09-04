const { createClient } = require('@libsql/client');
const client = createClient({
  url: 'libsql://upsc-db-sakshampratap2.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NzAyMDYsImlkIjoiMDFhMDY5MjEtMWUwMS03ZGY0LWE3NWQtMjgwZDBjZDcxZGYwIiwia2lkIjoiazlGZ1NVS1VDZ0U2b25RZ2EtWWdaVmlHNmpZT05mMU9SNkhxVmpWUXZVMCIsInJpZCI6IjMyOTQzYmJmLTFlNzUtNGE5ZC1hZTgxLTM0NzY2ZTA2Y2FlNSJ9.htl7S857z8hndiw-xJWt9PQkvZQJlOYOkJVS6nThAy4u19PTnU7YWMBSmHi6f16CDQcPjUrDLHP7MsSlXPNLCg'
});
async function run() {
  const breakdown = await client.execute('SELECT year, examStage, count(*) as cnt FROM pyqs GROUP BY year, examStage ORDER BY year DESC, examStage');
  console.log('--- PYQ Count Breakdown ---');
  console.log(breakdown.rows);
  
  const total = await client.execute('SELECT count(*) as c FROM pyqs');
  console.log('Total PYQs:', total.rows[0].c);
  
  const samples = await client.execute("SELECT questionText FROM pyqs WHERE examStage = 'Mains' LIMIT 2");
  console.log('Sample Mains Questions:');
  console.log(samples.rows);
}
run();
