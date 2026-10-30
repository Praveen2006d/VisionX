export type AnalysisStatus = 
  | 'uploaded'
  | 'waiting'
  | 'processing'
  | 'generating_summary'
  | 'indexing_events'
  | 'completed'
  | 'failed';

export type EventCategory = 
  | 'People' 
  | 'Movement' 
  | 'Objects' 
  | 'Important Events' 
  | 'Scene Changes';

export type EventSeverity = 'Low' | 'Medium' | 'High';

export interface VideoRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  duration: number; // in seconds
  width?: number;
  height?: number;
  fps?: number;
  uploadDate: string;
  status: AnalysisStatus;
  statusProgress?: number;
  error?: string;
  thumbnailUrl?: string;
  eventCount?: number;
}

export interface PersonObservation {
  id: string;
  description: string;
  clothing?: string;
  firstSeen: number;
  lastSeen: number;
  actions: string[];
}

export interface ObjectObservation {
  name: string;
  firstSeen: number;
  lastSeen: number;
  interaction?: string;
}

export interface VideoEvent {
  id: string;
  timestamp: number; // in seconds
  startTime: number;
  endTime: number;
  category: EventCategory;
  event: string;
  description: string;
  confidence: number;
  severity: EventSeverity;
}

export interface SceneChange {
  timestamp: number;
  description: string;
}

export interface VideoAnalysis {
  id: string;
  videoId: string;
  summary: string;
  mainActivities: string[];
  people: PersonObservation[];
  objects: ObjectObservation[];
  events: VideoEvent[];
  sceneChanges: SceneChange[];
  keyObservations: string[];
  analysisDurationMs: number;
  createdAt: string;
  modelUsed: string;
}

export interface ChatMessage {
  id: string;
  videoId: string;
  sender: 'user' | 'assistant';
  text: string;
  referencedTimestamps: number[];
  timestamp: string;
}

export interface SystemActivity {
  id: string;
  videoId?: string;
  videoName?: string;
  type: 'upload' | 'analysis_started' | 'analysis_completed' | 'chat' | 'delete';
  message: string;
  timestamp: string;
}

export interface SystemStats {
  totalVideos: number;
  videosAnalysed: number;
  totalEvents: number;
  totalAnalysisTimeSec: number;
}

export interface SystemHealth {
  geminiConnected: boolean;
  geminiModel: string;
  storageType: 'local-filesystem' | 'firestore';
  uptimeSeconds: number;
  serverVersion: string;
  maxUploadSizeBytes: number;
  supportedFormats: string[];
  activeProcessingTasks: number;
}
