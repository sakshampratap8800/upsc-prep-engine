const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'libsql://upsc-db-sakshampratap2.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NzAyMDYsImlkIjoiMDFhMDY5MjEtMWUwMS03ZGY0LWE3NWQtMjgwZDBjZDcxZGYwIiwia2lkIjoiazlGZ1NVS1VDZ0U2b25RZ2EtWWdaVmlHNmpZT05mMU9SNkhxVmpWUXZVMCIsInJpZCI6IjMyOTQzYmJmLTFlNzUtNGE5ZC1hZTgxLTM0NzY2ZTA2Y2FlNSJ9.htl7S857z8hndiw-xJWt9PQkvZQJlOYOkJVS6nThAy4u19PTnU7YWMBSmHi6f16CDQcPjUrDLHP7MsSlXPNLCg'
});

async function run() {
  await client.execute('DELETE FROM pyqs');
  console.log('Deleted all PYQs');
  await client.execute("DELETE FROM import_logs WHERE fileType IN ('prelims','mains','essay','anthropology','sociology')");
  console.log('Deleted PYQ import logs');
}
run();
