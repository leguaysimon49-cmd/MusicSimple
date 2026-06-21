import { NextResponse } from 'next/server';
import { demoTracks } from '@/lib/demoTracks';
import type { Track } from '@/lib/types';

const sections = [
  { title: 'Tendances MusicSimple', query: 'top music france 2025' },
  { title: 'Rap FR', query: 'rap francais hits' },
  { title: 'Chill', query: 'chill music playlist' },
  { title: 'Sport', query: 'workout music' }
];

async function search(query: string): Promise<Track[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return demoTracks;

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoCategoryId', '10');
  url.searchParams.set('maxResults', '10');
  url.searchParams.set('q', query);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) return demoTracks;

  const data = await response.json();
  return (data.items || []).map((item: any) => {
    const id = item?.id?.videoId;
    if (!id) return null;
    const snippet = item.snippet || {};
    return {
      id,
      title: snippet.title || 'Titre inconnu',
      artist: snippet.channelTitle || 'YouTube Music',
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      sourceUrl: `https://www.youtube.com/watch?v=${id}`
    };
  }).filter(Boolean);
}

export async function GET() {
  const data = await Promise.all(sections.map(async section => ({
    title: section.title,
    items: await search(section.query)
  })));

  return NextResponse.json({ sections: data });
}
