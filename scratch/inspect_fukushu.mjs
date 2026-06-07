import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data, error } = await supabase
    .from('study_materials')
    .select('*')
    .eq('id', '2ffd1875-435b-411c-bdbc-628cecccbc61')
    .single()
    
  if (error) {
    console.error('Error fetching quiz:', error)
  } else {
    console.log('Quiz ID:', data.id)
    console.log('Quiz Title:', data.title)
    console.log('Quiz Content:', JSON.stringify(data.content, null, 2))
  }
}

run()
