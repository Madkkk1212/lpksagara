import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: exams, error: examError } = await supabase
    .from('exam_tests')
    .select('id, title, category, created_at')
    .order('created_at', { ascending: false })
    
  if (examError) {
    console.error('Error fetching exams:', examError)
    return
  }
  
  console.log(`Found ${exams.length} exams.`)
  for (const exam of exams) {
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('audio_url, section_audio_url')
      .eq('test_id', exam.id)
      
    if (qError) {
      console.error(`Error fetching questions for exam ${exam.id}:`, qError)
      continue
    }
    
    let hasAudio = false;
    let hasSectionAudio = false;
    for (const q of questions || []) {
      if (q.audio_url) hasAudio = true;
      if (q.section_audio_url) hasSectionAudio = true;
    }
    
    console.log(`Exam ID: ${exam.id} | Title: "${exam.title}" | Category: ${exam.category} | Question Audio: ${hasAudio} | Section Audio: ${hasSectionAudio} | Created At: ${exam.created_at}`)
  }
}

run()
