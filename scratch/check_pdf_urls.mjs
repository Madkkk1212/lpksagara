import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^"|"$/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPDFs() {
  const { data: materials, error } = await supabase
    .from("study_materials")
    .select("id, title, content")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching study materials:", error);
    return;
  }

  for (const m of materials) {
    let content = m.content;
    if (typeof content === 'string') {
      try { content = JSON.parse(content); } catch(e) {}
    }
    const pdfUrl = content.pdf_url || content.document_url || content.sections?.[0]?.media?.pdf_url || content.sections?.[0]?.media?.pdfUrl || content.sections?.[0]?.media?.pdf;
    if (pdfUrl) {
      console.log(`Title: ${m.title}`);
      console.log(`Original PDF URL: ${pdfUrl}`);
      console.log(`-----------------------------`);
    }
  }
}

checkPDFs();
