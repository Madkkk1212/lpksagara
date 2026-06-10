import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: materials, error } = await supabase
    .from('study_materials')
    .select('id, title, material_type, content, created_at')
    .in('material_type', ['quiz', 'latihan'])
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching materials:', error)
    return
  }
  
  console.log(`Checking ${materials.length} quizzes and latihan items in the database...`)
  console.log('------------------------------------------------------------')
  
  let emptyCount = 0
  let normalCount = 0
  
  for (const m of materials) {
    const content = m.content || {}
    const hasExercises = Array.isArray(content.exercises) && content.exercises.length > 0
    const hasSections = Array.isArray(content.sections) && content.sections.length > 0
    const keys = Object.keys(content)
    
    // If it only contains duration_minutes, or is totally empty
    const isWiped = (!hasExercises && !hasSections) && (content.duration_minutes !== undefined || keys.length === 0)
    
    if (isWiped) {
      console.log(`[EMPTY/WIPED] Type: ${m.material_type} | Title: "${m.title}" | ID: ${m.id}`)
      console.log(`              Content Keys: ${JSON.stringify(keys)} | Content: ${JSON.stringify(content)}`)
      console.log('------------------------------------------------------------')
      emptyCount++
    } else {
      normalCount++
    }
  }
  
  console.log(`Summary: ${normalCount} active/intact items, ${emptyCount} wiped/empty items.`)
}

run()
