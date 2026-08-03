import { Track } from '../types';
import { parseAudioFilename, getAudioDuration } from './fileMetadata';

export interface ScanProgress {
  scannedCount: number;
  foundTracksCount: number;
  currentFolder: string;
  isComplete: boolean;
}

/**
 * Recursively scans a DirectoryHandle obtained via FileSystemAccess API (window.showDirectoryPicker)
 */
export async function scanDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: (prog: ScanProgress) => void
): Promise<Track[]> {
  const foundTracks: Track[] = [];
  let scannedCount = 0;

  async function walk(handle: FileSystemDirectoryHandle, pathStr: string) {
    // @ts-ignore
    for await (const entry of handle.values()) {
      scannedCount++;
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const fileName = fileHandle.name;
        if (/\.(mp3|flac|wav|m4a|aac|ogg|wma|opus|mp4)$/i.test(fileName)) {
          try {
            const file = await fileHandle.getFile();
            const objectUrl = URL.createObjectURL(file);
            const { title, artist, album } = parseAudioFilename(file.name);
            const duration = await getAudioDuration(objectUrl);
            const ext = fileName.split('.').pop()?.toUpperCase() || 'AUDIO';

            foundTracks.push({
              id: `phone-scan-${Date.now()}-${foundTracks.length}-${Math.random().toString(36).substring(2, 6)}`,
              title,
              artist: artist !== 'Musique du Téléphone' ? artist : 'Téléphone (Stockage)',
              album: album || pathStr || 'Mémoire Interne',
              duration,
              url: objectUrl,
              format: ext,
              isPreset: false,
            });

            if (onProgress) {
              onProgress({
                scannedCount,
                foundTracksCount: foundTracks.length,
                currentFolder: pathStr || handle.name,
                isComplete: false,
              });
            }
          } catch (err) {
            console.warn(`Could not read file ${fileName}:`, err);
          }
        }
      } else if (entry.kind === 'directory') {
        const subDir = entry as FileSystemDirectoryHandle;
        // Avoid scanning hidden or system folders
        if (!subDir.name.startsWith('.')) {
          await walk(subDir, `${pathStr}/${subDir.name}`);
        }
      }
    }
  }

  await walk(dirHandle, dirHandle.name);

  if (onProgress) {
    onProgress({
      scannedCount,
      foundTracksCount: foundTracks.length,
      currentFolder: 'Terminé',
      isComplete: true,
    });
  }

  return foundTracks;
}

/**
 * Checks if FileSystemAccess directory picker is supported in current browser
 */
export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}
