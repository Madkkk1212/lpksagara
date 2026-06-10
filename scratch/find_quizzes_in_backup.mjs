import fs from 'fs'
import readline from 'readline'

const backupFilePath = 'backup porstasql/backupanbaru 5 juni.sql'

const wipedIds = [
  '945ecb25-5f73-479e-87ba-06c1011eeae0',
  '670ecea4-3754-448d-8adc-44ef62a7090b',
  'a399b817-3e07-4c9b-a7dc-627c985ef01e',
  'ceecb38a-5d33-48b5-ac77-fcd45b96716a',
  '5aa441fc-4950-4542-8527-95e02d33dca6',
  '1e9170db-661b-419c-8137-c312bc2f2630',
  'a840186c-b321-42fd-8c63-55b7c91e6a16',
  '8b05d4b7-76b9-4c65-a843-0a01fda2d058'
]

async function run() {
  console.log(`Searching for ${wipedIds.length} IDs in ${backupFilePath}...`)
  
  const fileStream = fs.createReadStream(backupFilePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  
  let matchCount = 0
  
  for await (const line of rl) {
    for (const id of wipedIds) {
      if (line.includes(id)) {
        console.log(`Found line with ID ${id}:`)
        console.log(line.substring(0, 1000) + (line.length > 1000 ? '...[TRUNCATED]' : ''))
        console.log('------------------------------------------------------------')
        matchCount++
      }
    }
  }
  
  console.log(`Done. Found ${matchCount} matching lines.`)
}

run()
