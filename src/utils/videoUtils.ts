import { VideoRecord, VideoAnalysis, VideoEvent, SystemStats, EventSeverity } from '../types';

/**
 * Format seconds into mm:ss or hh:mm:ss format (e.g. 31 -> "00:31", 3665 -> "01:01:05")
 */
export function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Parses timestamp string (e.g. "00:31", "1:15", "01:02:03") to numeric seconds
 */
export function parseTimestampToSeconds(tsStr: string): number {
  if (!tsStr) return 0;
  const clean = tsStr.trim().replace(/[\[\]\(\)]/g, '');
  const parts = clean.split(':').map(p => Number(p));
  if (parts.some(p => isNaN(p))) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Finds all timestamps like 00:31, 1:15, 01:23:45 in a string of text.
 * Returns array of parsed second numbers.
 */
export function extractTimestampsFromText(text: string): number[] {
  if (!text) return [];
  // Match patterns like 00:31 or 1:30 or 01:02:03
  const regex = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;
  const matches = text.match(regex);
  if (!matches) return [];

  const timestamps: number[] = [];
  for (const m of matches) {
    const secs = parseTimestampToSeconds(m);
    if (!timestamps.includes(secs)) {
      timestamps.push(secs);
    }
  }
  return timestamps.sort((a, b) => a - b);
}

/**
 * Format bytes into human-readable B, KB, MB, GB
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Filter and sort video events chronologically
 */
export function filterEvents(
  events: VideoEvent[],
  category?: string,
  searchQuery?: string
): VideoEvent[] {
  if (!events) return [];

  return events
    .filter(ev => {
      const matchCat = !category || category === 'All' || ev.category === category;
      const matchSearch =
        !searchQuery ||
        searchQuery.trim() === '' ||
        ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Computes dashboard statistics from current videos and analyses
 */
export function calculateSystemStats(
  videos: VideoRecord[],
  analyses: VideoAnalysis[]
): SystemStats {
  const totalVideos = videos.length;
  const videosAnalysed = videos.filter(v => v.status === 'completed').length;
  
  let totalEvents = 0;
  let totalAnalysisTimeMs = 0;

  for (const a of analyses) {
    totalEvents += a.events?.length || 0;
    totalAnalysisTimeMs += a.analysisDurationMs || 0;
  }

  // Also include eventCount on videos if analysis is not yet loaded in memory
  if (analyses.length === 0 && videos.length > 0) {
    totalEvents = videos.reduce((acc, v) => acc + (v.eventCount || 0), 0);
  }

  return {
    totalVideos,
    videosAnalysed,
    totalEvents,
    totalAnalysisTimeSec: Math.round(totalAnalysisTimeMs / 1000)
  };
}

/**
 * Get styling tokens for event severity based on VisionX palette
 */
export function getSeverityStyle(severity: EventSeverity): {
  badge: string;
  bg: string;
  text: string;
} {
  switch (severity) {
    case 'High':
      return {
        badge: 'bg-[#C94B45]/10 text-[#C94B45] border-[#C94B45]/30',
        bg: 'border-l-4 border-l-[#C94B45]',
        text: 'text-[#C94B45]'
      };
    case 'Medium':
      return {
        badge: 'bg-[#D69A36]/10 text-[#D69A36] border-[#D69A36]/30',
        bg: 'border-l-4 border-l-[#D69A36]',
        text: 'text-[#D69A36]'
      };
    case 'Low':
    default:
      return {
        badge: 'bg-[#39845A]/10 text-[#39845A] border-[#39845A]/30',
        bg: 'border-l-4 border-l-[#39845A]',
        text: 'text-[#39845A]'
      };
  }
}
