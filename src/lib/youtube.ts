/**
 * Extracts the video id from the two YouTube URL shapes the admin panel accepts.
 * Returns null for anything else, so a malformed row is skipped rather than
 * rendered as a broken embed. Mirrors the videos_youtube_url CHECK constraint.
 */
export function youtubeId(url: string): string | null {
  if (!url) return null;
  const m =
    url.match(/^https:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,20})/) ??
    url.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{6,20})/);
  return m ? m[1] : null;
}

/** Privacy-preserving embed URL. Only ever loaded after an explicit click. */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}
