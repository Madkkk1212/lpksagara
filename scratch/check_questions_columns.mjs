import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  // Query questions with non-null audio_url
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_text, test_id, audio_url, image_url, video_url')
    .not('audio_url', 'is', null)
    .limit(5)
    
  if (error) {
    console.error('Error fetching questions:', error)
  } else {
    console.log('Questions with non-null audio_url:')
    console.log(JSON.stringify(questions, null, 2))
  }
}

run()
