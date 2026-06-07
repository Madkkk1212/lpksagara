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
    if (m.title.toLowerCase().includes('fukushu') || m.content?.audioUrl || m.content?.audio_url || m.content?.audio) {
      console.log('====================================')
      console.log('ID:', m.id)
      console.log('Title:', m.title)
      console.log('Full Content:', JSON.stringify(m.content, null, 2))
    }
  }
}

run()
