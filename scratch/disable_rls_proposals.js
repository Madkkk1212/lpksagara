const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:54322/postgres"
  });
  
  try {
    await client.connect();
    console.log("Connected to DB. Disabling RLS on teacher_proposals...");
    await client.query("ALTER TABLE teacher_proposals DISABLE ROW LEVEL SECURITY;");
    console.log("Success: RLS disabled.");
  } catch (err) {
    console.error("Failed to disable RLS:", err);
  } finally {
    await client.end();
  }
}

main();
