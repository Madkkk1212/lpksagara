async function run() {
  const url = 'https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev/1778740369546_ij2vb9z6jji.mp3'
  try {
    const res = await fetch(url, { method: 'HEAD' })
    console.log('URL HEAD status:', res.status, res.statusText)
    console.log('Headers:', Object.fromEntries(res.headers.entries()))
  } catch (err) {
    console.error('Error fetching URL:', err.message)
  }
}
run()
