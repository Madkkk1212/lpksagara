import http from 'http';

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const titleMatch = data.match(/<title>(.*?)<\/title>/);
    const iconMatch = data.match(/<link rel="(icon|shortcut icon|apple-touch-icon)".*?href="(.*?)".*?>/g);
    
    console.log('Title:', titleMatch ? titleMatch[1] : 'NOT FOUND');
    console.log('Icons Found:', iconMatch ? JSON.stringify(iconMatch, null, 2) : 'NOT FOUND');
  });
}).on('error', (err) => {
  console.error('Error fetching page:', err.message);
});
