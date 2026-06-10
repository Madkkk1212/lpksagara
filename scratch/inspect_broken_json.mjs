import fs from 'fs'
import readline from 'readline'

const backupFilePath = 'backup porstasql/backupanbaru 5 juni.sql'
const id = '1e9170db-661b-419c-8137-c312bc2f2630'

async function run() {
  const fileStream = fs.createReadStream(backupFilePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  
  for await (const line of rl) {
    if (line.includes(id)) {
      const parts = line.split('\t')
      if (parts[0] === id) {
        const contentStr = parts[4]
        console.log('--- String Length:', contentStr.length)
        console.log('--- Raw Substring around index 917:')
        const start = Math.max(0, 917 - 100)
        const end = Math.min(contentStr.length, 917 + 100)
        console.log(contentStr.substring(start, end))
        console.log('------------------------------------------------')
        
        // Let's print the entire raw string to see what could be wrong
        console.log('Full string:')
        console.log(contentStr)
      }
    }
  }
}

run()
