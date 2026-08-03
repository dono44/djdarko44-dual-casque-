/**
 * Helper to parse local audio filenames into artist, title and format
 */
export function parseAudioFilename(fileName: string): { title: string; artist: string; album: string } {
  // Remove file extension
  const cleanName = fileName.replace(/\.[^/.]+$/, '');

  // Case: "Artist - Song Title"
  if (cleanName.includes(' - ')) {
    const parts = cleanName.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    if (artist && title) {
      return { artist, title, album: 'Téléphone Android' };
    }
  }

  // Case: "Artist_Song_Title"
  if (cleanName.includes('_')) {
    const parts = cleanName.split('_').filter(Boolean);
    if (parts.length >= 2) {
      const artist = parts[0].trim();
      const title = parts.slice(1).join(' ').trim();
      return { artist, title, album: 'Téléphone Android' };
    }
  }

  return {
    title: cleanName,
    artist: 'Musique du Téléphone',
    album: 'Stockage Local',
  };
}

/**
 * Measure audio duration asynchronously using an HTML5 Audio object
 */
export function getAudioDuration(fileUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = fileUrl;

    const timeout = setTimeout(() => {
      resolve(180); // Fallback to 3 min if loading takes too long
    }, 3000);

    audio.onloadedmetadata = () => {
      clearTimeout(timeout);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        resolve(audio.duration);
      } else {
        resolve(180);
      }
    };

    audio.onerror = () => {
      clearTimeout(timeout);
      resolve(180);
    };
  });
}
