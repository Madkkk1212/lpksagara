import fs from 'fs';

async function diagnose() {
  const pdfUrl = 'https://storage.sagaracloud.web.id/1779620908847_r8uhonz303r.pdf';
  const log = [];

  log.push(`Fetching URL: ${pdfUrl}`);
  try {
    const res = await fetch(pdfUrl, {
      headers: { 'User-Agent': 'SagaraLMS/1.0' }
    });
    log.push(`Response Status: ${res.status}`);
    log.push(`Response OK: ${res.ok}`);
    log.push(`Headers:`);
    for (const [k, v] of res.headers.entries()) {
      log.push(`  ${k}: ${v}`);
    }
  } catch (err) {
    log.push(`Fetch failed with error:`);
    log.push(err.stack || err.message || err);
  }

  fs.writeFileSync('scratch/fetch_result.txt', log.join('\n'));
  console.log("Done!");
}

diagnose();
