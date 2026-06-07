async function run() {
  const url = 'https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev/1778740369546_ij2vb9z6jji.mp3'
  try {
    const res = await fetch(url)
    console.log('HTTP Status:', res.status, res.statusText)
    console.log('Headers:', Object.fromEntries(res.headers.entries()))
    
    const body = await res.text()
    console.log('Response Body (first 1000 chars):')
    console.log(body.slice(0, 1000))
  } catch (err) {
    console.error('Fetch error:', err.message)
  }
}
run()
