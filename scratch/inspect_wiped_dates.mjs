import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const ids = [
    '945ecb25-5f73-479e-87ba-06c1011eeae0',
    '670ecea4-3754-448d-8adc-44ef62a7090b'
  ]
  
  const { data, error } = await supabase
    .from('study_materials')
    .select('id, title, created_at')
    .in('id', ids)
    
  if (error) {
    console.error(error)
    return
  }
  
  for (const m of data) {
    console.log(`Title: "${m.title}" | ID: ${m.id} | Created At: ${m.created_at}`)
  }
}

run()
