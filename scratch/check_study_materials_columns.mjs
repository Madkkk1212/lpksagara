import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data, error } = await supabase
    .from('study_materials')
    .select('*')
    .limit(1)
    
  if (error) {
    console.error('Error fetching study_materials:', error)
  } else {
    console.log('study_materials fields:', data && data[0] ? Object.keys(data[0]) : 'No data')
    console.log('study_materials sample row:', data && data[0] ? JSON.stringify(data[0], null, 2) : 'No data')
  }
}

run()
