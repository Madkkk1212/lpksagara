import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

async function test() {
  try {
    console.log('Fetching News...');
    const feed = await parser.parseURL('https://news.yahoo.co.jp/rss/topics/top-picks.xml');
    console.log('Success! Feed title:', feed.title);
    console.log('Items found:', feed.items.length);
    console.log('First item:', feed.items[0].title);
  } catch (err) {
    console.error('FAILED fetching RSS:', err);
  }
}

test();
