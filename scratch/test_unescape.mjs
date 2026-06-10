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
        let contentStr = parts[4]
        
        // Replace double backslashes with single backslash
        contentStr = contentStr.replace(/\\\\/g, '\\')
        
        try {
          const parsed = JSON.parse(contentStr)
          console.log("SUCCESS! Parsed JSON content for ID 1e9170db-661b-419c-8137-c312bc2f2630 successfully!")
          console.log("Number of questions in restored JSON:", parsed.sections[0].questions.length)
        } catch (e) {
          console.error("FAIL:", e.message)
        }
      }
    }
  }
}

run()
