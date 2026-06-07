import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: materials, error } = await supabase
    .from('study_materials')
    .select('id, title, material_type, content')
    
  if (error) {
    console.error('Error:', error)
    return
  }
  
  for (const m of materials) {
    const c = m.content || {}
    let found = false
    let details = {}
    
    if (c.audioUrl || c.audio_url || c.audio) {
      found = true
      details.global = c.audioUrl || c.audio_url || c.audio
    }
    
    if (c.sections) {
      for (const sec of c.sections) {
        if (sec.media?.audio_url || sec.media?.audioUrl || sec.media?.audio) {
          found = true
          details.section = sec.media.audio_url || sec.media.audioUrl || sec.media.audio
        }
        if (sec.questions) {
          for (const q of sec.questions) {
            if (q.audio_url || q.audioUrl || q.audio) {
              found = true
              details.question = q.audio_url || q.audioUrl || q.audio
            }
          }
        }
      }
    }
    
    if (c.exercises) {
      for (const ex of c.exercises) {
        if (ex.audio_url || ex.audioUrl || ex.audio) {
          found = true
          details.exercise = ex.audio_url || ex.audioUrl || ex.audio
        }
      }
    }
    
    if (found) {
      console.log(`FOUND AUDIO in Material ID: ${m.id} | Title: "${m.title}" | Type: ${m.material_type}`)
      console.log('Details:', details)
    }
  }
}

run()
