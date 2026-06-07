import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: materials, error } = await supabase
    .from('study_materials')
    .select('id, title, material_type, created_at, content')
    .eq('material_type', 'quiz')
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${materials.length} quizzes.`)
  for (const m of materials) {
    const hasGlobalAudio = !!(m.content?.audio_url || m.content?.audioUrl || m.content?.audio);
    let hasSectionAudio = false;
    let hasQuestionAudio = false;
    
    if (m.content?.sections) {
      for (const sec of m.content.sections) {
        if (sec.media?.audio_url || sec.media?.audioUrl || sec.media?.audio) {
          hasSectionAudio = true;
        }
        if (sec.questions) {
          for (const q of sec.questions) {
            if (q.audio_url || q.audioUrl || q.audio) {
              hasQuestionAudio = true;
            }
          }
        }
      }
    }
    
    if (m.content?.exercises) {
      for (const ex of m.content.exercises) {
        if (ex.audio_url || ex.audioUrl || ex.audio) {
          hasQuestionAudio = true;
        }
      }
    }
    
    console.log(`Quiz ID: ${m.id} | Title: "${m.title}" | Global Audio: ${hasGlobalAudio} | Section Audio: ${hasSectionAudio} | Question Audio: ${hasQuestionAudio} | Created At: ${m.created_at}`)
  }
}

run()
