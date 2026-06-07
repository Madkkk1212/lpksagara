import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: materials, error } = await supabase
    .from('study_materials')
    .select('id, title, material_type, content')
    .eq('material_type', 'quiz')
    .order('created_at', { ascending: false })
    .limit(10)
    
  if (error) {
    console.error('Error:', error)
    return
  }
  
  for (const m of materials) {
    console.log('--- QUIZ ---')
    console.log('ID:', m.id)
    console.log('Title:', m.title)
    console.log('Content Keys:', Object.keys(m.content || {}))
    console.log('Content exercises/sections count:', (m.content?.exercises || m.content?.sections || []).length)
    if (m.content?.audio_url || m.content?.audioUrl || m.content?.audio) {
      console.log('Content-level Audio URL:', m.content.audio_url || m.content.audioUrl || m.content.audio)
    }
    // Print first item / exercise / section to see keys
    if (m.content?.sections) {
      const sec = m.content.sections[0]
      console.log('Section keys:', Object.keys(sec || {}))
      console.log('Section media:', sec.media)
      if (sec.questions && sec.questions.length > 0) {
        console.log('First section question keys:', Object.keys(sec.questions[0] || {}))
        console.log('First section question sample:', JSON.stringify(sec.questions[0]))
      }
    } else if (m.content?.exercises) {
      const ex = m.content.exercises[0]
      console.log('First exercise keys:', Object.keys(ex || {}))
      console.log('First exercise sample:', JSON.stringify(ex))
    }
  }
}

run()
