import fetch from 'node-fetch';

const YT_OEMBED = 'https://www.youtube.com/oembed';

export function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1);
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      // handle shorts
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
    }
  } catch (_) {}
  return null;
}

export async function fetchYouTubeOEmbed(url) {
  const oembedUrl = `${YT_OEMBED}?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl, { headers: { 'User-Agent': 'music-player-api' } });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to fetch oEmbed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return {
    title: data.title || null,
    authorName: data.author_name || null,
    thumbnail: data.thumbnail_url || null,
  };
}

export function buildYouTubeThumbnail(videoId) {
  if (!videoId) return null;
  // Prefer hqdefault; could try maxresdefault but may 404
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
