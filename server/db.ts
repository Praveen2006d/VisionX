import fs from 'fs';
import path from 'path';
import { VideoRecord, VideoAnalysis, ChatMessage, SystemActivity, VideoEvent } from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'visionx_database.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export interface DatabaseSchema {
  videos: Record<string, VideoRecord>;
  analyses: Record<string, VideoAnalysis>;
  chats: Record<string, ChatMessage[]>;
  activities: SystemActivity[];
}

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class DatabaseService {
  private data: DatabaseSchema = {
    videos: {},
    analyses: {},
    chats: {},
    activities: []
  };

  constructor() {
    this.load();
    this.seedDefaultActivities();
  }

  private load(): void {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB] Failed to load database file, initializing empty:', err);
      this.data = { videos: {}, analyses: {}, chats: {}, activities: [] };
      this.save();
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to persist database:', err);
    }
  }

  private seedDefaultActivities(): void {
    if (this.data.activities.length === 0) {
      this.addActivity({
        type: 'upload',
        message: 'VISIONX Video Intelligence System initialized and ready for video ingestion.',
        timestamp: new Date().toISOString()
      });
    }
  }

  // --- Videos ---
  public getVideos(): VideoRecord[] {
    return Object.values(this.data.videos).sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  public getVideo(id: string): VideoRecord | undefined {
    return this.data.videos[id];
  }

  public saveVideo(video: VideoRecord): void {
    this.data.videos[video.id] = video;
    this.save();
  }

  public updateVideoStatus(
    id: string,
    status: VideoRecord['status'],
    options?: { progress?: number; error?: string; eventCount?: number }
  ): void {
    const v = this.data.videos[id];
    if (v) {
      v.status = status;
      if (options?.progress !== undefined) v.statusProgress = options.progress;
      if (options?.error !== undefined) v.error = options.error;
      if (options?.eventCount !== undefined) v.eventCount = options.eventCount;
      this.save();
    }
  }

  public updateVideoName(id: string, fileName: string): boolean {
    const v = this.data.videos[id];
    if (v) {
      v.fileName = fileName;
      this.save();
      return true;
    }
    return false;
  }

  public deleteVideo(id: string): boolean {
    if (!this.data.videos[id]) return false;
    
    // Clean up video file if it exists in uploads
    const video = this.data.videos[id];
    if (video.fileUrl && video.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), video.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('[DB] Could not delete video file:', filePath);
        }
      }
    }

    delete this.data.videos[id];
    delete this.data.analyses[id];
    delete this.data.chats[id];
    this.addActivity({
      videoId: id,
      videoName: video.fileName,
      type: 'delete',
      message: `Deleted video "${video.fileName}" and all associated analysis data.`,
      timestamp: new Date().toISOString()
    });
    this.save();
    return true;
  }

  // --- Analysis ---
  public getAnalysis(videoId: string): VideoAnalysis | undefined {
    return this.data.analyses[videoId];
  }

  public getAllAnalyses(): VideoAnalysis[] {
    return Object.values(this.data.analyses);
  }

  public saveAnalysis(analysis: VideoAnalysis): void {
    this.data.analyses[analysis.videoId] = analysis;
    // Update eventCount on video record
    if (this.data.videos[analysis.videoId]) {
      this.data.videos[analysis.videoId].eventCount = analysis.events?.length || 0;
      this.data.videos[analysis.videoId].status = 'completed';
    }
    this.save();
  }

  // --- Events ---
  public getEvents(videoId: string): VideoEvent[] {
    const analysis = this.data.analyses[videoId];
    return analysis ? analysis.events : [];
  }

  public getAllRecentEvents(limit = 10): (VideoEvent & { videoName: string; videoId: string })[] {
    const all: (VideoEvent & { videoName: string; videoId: string })[] = [];
    for (const [vId, analysis] of Object.entries(this.data.analyses)) {
      const v = this.data.videos[vId];
      const videoName = v ? v.fileName : 'Unknown Video';
      if (analysis.events) {
        for (const ev of analysis.events) {
          all.push({ ...ev, videoName, videoId: vId });
        }
      }
    }
    return all.slice(0, limit);
  }

  // --- Chat ---
  public getChatHistory(videoId: string): ChatMessage[] {
    return this.data.chats[videoId] || [];
  }

  public addChatMessage(message: ChatMessage): void {
    if (!this.data.chats[message.videoId]) {
      this.data.chats[message.videoId] = [];
    }
    this.data.chats[message.videoId].push(message);
    this.save();
  }

  // --- Activities ---
  public getActivities(limit = 20): SystemActivity[] {
    return [...this.data.activities].reverse().slice(0, limit);
  }

  public addActivity(activity: Omit<SystemActivity, 'id'>): void {
    const item: SystemActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };
    this.data.activities.push(item);
    if (this.data.activities.length > 200) {
      this.data.activities = this.data.activities.slice(-100);
    }
    this.save();
  }
}

export const db = new DatabaseService();
