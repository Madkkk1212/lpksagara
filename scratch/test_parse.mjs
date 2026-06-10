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
        try {
          JSON.parse(contentStr)
          console.log("Parsed successfully!")
        } catch (e) {
          console.error("Parse error:", e.message)
          
          // Let's get the position from the error message if possible
          const match = e.message.match(/at position (\d+)/)
          if (match) {
            const pos = parseInt(match[1])
            console.log(`Error at position ${pos}`)
            console.log("Around position:")
            console.log("...", contentStr.substring(pos - 30, pos), "-->", contentStr[pos], "<--", contentStr.substring(pos + 1, pos + 30), "...")
            console.log(`Char code: ${contentStr.charCodeAt(pos)}`)
          }
        }
      }
    }
  }
}

run()
