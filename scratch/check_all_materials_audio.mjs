import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: materials, error } = await supabase
    .from('study_materials')
    .select('id, title, material_type, content')
    .neq('material_type', 'quiz')
    .order('created_at', { ascending: false })
    .limit(10)
    
  if (error) {
    console.error('Error:', error)
    return
  }
  
  for (const m of materials) {
    console.log('--- MATERIAL ---')
    console.log('ID:', m.id)
    console.log('Title:', m.title)
    console.log('Type:', m.material_type)
    console.log('Content Keys:', Object.keys(m.content || {}))
    
    const c = m.content || {}
    const audioKeys = ['audio', 'audioUrl', 'audio_url', 'audioPath', 'audio_path']
    for (const key of audioKeys) {
      if (c[key] !== undefined) {
        console.log(`  content.${key}:`, c[key])
      }
    }
  }
}

run()
