import fs from 'fs'
import readline from 'readline'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const backupFilePath = 'backup porstasql/backupanbaru 5 juni.sql'

const wipedIds = [
  'a399b817-3e07-4c9b-a7dc-627c985ef01e',
  '5aa441fc-4950-4542-8527-95e02d33dca6',
  '1e9170db-661b-419c-8137-c312bc2f2630',
  'ceecb38a-5d33-48b5-ac77-fcd45b96716a',
  '8b05d4b7-76b9-4c65-a843-0a01fda2d058',
  'a840186c-b321-42fd-8c63-55b7c91e6a16',
  'd8944379-6f5b-41ba-b78b-ec7851651fd0'
]

async function run() {
  console.log(`Starting recovery of ${wipedIds.length} quizzes...`)
  
  const fileStream = fs.createReadStream(backupFilePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  
  const extractedData = {}
  
  for await (const line of rl) {
    for (const id of wipedIds) {
      if (line.includes(id)) {
        const parts = line.split('\t')
        if (parts.length >= 5 && parts[0] === id) {
          let contentStr = parts[4]
          // Unescape backslashes from Postgres COPY format
          contentStr = contentStr.replace(/\\\\/g, '\\')
          try {
            const contentObj = JSON.parse(contentStr)
            extractedData[id] = contentObj
            console.log(`[Extracted] Found data for quiz "${parts[3]}" (${id})`)
          } catch (e) {
            console.error(`Error parsing JSON for ID ${id}:`, e.message)
          }
        }
      }
    }
  }
  
  console.log('\nRestoring data in database...')
  console.log('------------------------------------------------------------')
  
  for (const [id, content] of Object.entries(extractedData)) {
    console.log(`Restoring content for ID: ${id}...`)
    
    // Fetch the current row to see if we should keep duration_minutes if it's already set
    const { data: current } = await supabase
      .from('study_materials')
      .select('content')
      .eq('id', id)
      .single()
      
    let finalContent = { ...content }
    if (current?.content?.duration_minutes) {
      finalContent.duration_minutes = current.content.duration_minutes
    }
    
    const { data, error } = await supabase
      .from('study_materials')
      .update({ content: finalContent })
      .eq('id', id)
      .select()
      
    if (error) {
      console.error(`❌ Failed to restore ID ${id}:`, error.message)
    } else {
      console.log(`✅ Successfully restored ID ${id} ("${data[0].title}")`)
    }
  }
  
  console.log('\nRecovery process finished.')
}

run()
