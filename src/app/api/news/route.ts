import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

// Revalidate every 10 minutes (600 seconds)
export const revalidate = 600;

const parser = new Parser({
  customFields: {
    item: ['image'],
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

export async function GET() {
  try {
    // Yahoo Japan Domestic Category News (Has native images in RSS)
    const feed = await parser.parseURL('https://news.yahoo.co.jp/rss/categories/domestic.xml');

    const newsItems = feed.items.map(item => ({
      id: item.guid || item.link,
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      content: item.contentSnippet || item.content,
      // Yahoo Japan RSS usually doesn't provide images directly in the feed 
      // but we can try to extract from description or just use a placeholder
      image: extractImage(item),
    }));

    return NextResponse.json({
      lastUpdated: new Date().toISOString(),
      items: newsItems,
    });
  } catch (error) {
    console.error('Error fetching Yahoo Japan RSS:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

function extractImage(item: any) {
  // Use the native image field from the RSS if available (domestic category feed)
  if (item.image) return item.image;
  
  // Try to find image in content or description as fallback
  const text = item.content || item.description || '';
  const match = text.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}
