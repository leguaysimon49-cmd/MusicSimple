import { NextResponse } from 'next/server';
import { demoTracks } from '@/lib/demoTracks';
import type { Track } from '@/lib/types';

function normalize(item: any): Track | null {
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
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || 'top music france';
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      results: demoTracks.filter(t => `${t.title} ${t.artist}`.toLowerCase().includes(q.toLowerCase())).length
        ? demoTracks.filter(t => `${t.title} ${t.artist}`.toLowerCase().includes(q.toLowerCase()))
        : demoTracks,
      demo: true
    });
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoCategoryId', '10'); // Music
  url.searchParams.set('maxResults', '16');
  url.searchParams.set('q', q);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, { next: { revalidate: 120 } });
  if (!response.ok) {
    return NextResponse.json({ results: demoTracks, demo: true }, { status: 200 });
  }

  const data = await response.json();
  const results = (data.items || []).map(normalize).filter(Boolean);
  return NextResponse.json({ results });
}
