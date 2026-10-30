import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { db } from './server/db';
import { geminiService } from './server/geminiService';
import { videoService } from './server/videoService';
import { VideoRecord, ChatMessage, SystemHealth } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure folders exist
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `video_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Supported formats: MP4, MOV, WebM.'));
    }
  }
});

// Middleware
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// --- API Endpoints ---

// 1. System Status
app.get('/api/system/status', (_req: Request, res: Response) => {
  const health: SystemHealth = {
    geminiConnected: geminiService.isConnected(),
    geminiModel: geminiService.getModelName(),
    storageType: 'local-filesystem',
    uptimeSeconds: Math.round(process.uptime()),
    serverVersion: 'VISIONX v2.4.0 (Enterprise Intelligence Edition)',
    maxUploadSizeBytes: 500 * 1024 * 1024,
    supportedFormats: ['MP4', 'MOV', 'WebM'],
    activeProcessingTasks: db.getVideos().filter(v => ['processing', 'generating_summary', 'indexing_events'].includes(v.status)).length
  };
  res.json(health);
});

// 2. List all videos
app.get('/api/videos', (_req: Request, res: Response) => {
  const videos = db.getVideos();
  res.json(videos);
});

// 3. Get single video
app.get('/api/videos/:id', (req: Request, res: Response) => {
  const video = db.getVideo(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  res.json(video);
});

// 4. Upload video
app.post('/api/videos/upload', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const filePath = req.file.path;
    const videoId = `vid_${Date.now()}`;
    const metadata = await videoService.extractMetadata(filePath);
    const thumbnailUrl = await videoService.generateThumbnail(filePath, videoId, 2);

    const videoRecord: VideoRecord = {
      id: videoId,
      fileName: req.file.originalname || path.basename(filePath),
      fileUrl: `/uploads/${path.basename(filePath)}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype || 'video/mp4',
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      uploadDate: new Date().toISOString(),
      status: 'uploaded',
      statusProgress: 100,
      thumbnailUrl: thumbnailUrl || undefined,
      eventCount: 0
    };

    db.saveVideo(videoRecord);
    db.addActivity({
      videoId: videoId,
      videoName: videoRecord.fileName,
      type: 'upload',
      message: `Uploaded new video "${videoRecord.fileName}" (${Math.round(videoRecord.duration)}s, ${metadata.width}x${metadata.height})`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(videoRecord);
  } catch (err: any) {
    console.error('[API] Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload and process video' });
  }
});

// 5. Generate / Load Sample Demo Footage
app.post('/api/videos/sample', async (_req: Request, res: Response) => {
  try {
    const sample = await videoService.generateSampleCctvVideo();
    const videoId = `vid_sample_cctv`;

    let existing = db.getVideo(videoId);
    if (!existing) {
      const record: VideoRecord = {
        id: videoId,
        fileName: 'CCTV_Main_Entrance_CAM04.mp4',
        fileUrl: `/uploads/${sample.fileName}`,
        fileSize: sample.size,
        mimeType: 'video/mp4',
        duration: sample.duration,
        width: 1280,
        height: 720,
        fps: 25,
        uploadDate: new Date().toISOString(),
        status: 'uploaded',
        thumbnailUrl: sample.thumbnailUrl,
        eventCount: 0
      };
      db.saveVideo(record);
      db.addActivity({
        videoId: videoId,
        videoName: record.fileName,
        type: 'upload',
        message: 'Imported benchmark CCTV sample recording for video intelligence testing.',
        timestamp: new Date().toISOString()
      });
      existing = record;
    }

    res.json(existing);
  } catch (err: any) {
    console.error('[API] Sample video generation error:', err);
    res.status(500).json({ error: 'Failed to generate sample video' });
  }
});

// 6. Stream video with HTTP 206 partial range support
app.get('/api/videos/:id/stream', (req: Request, res: Response) => {
  const video = db.getVideo(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const filePath = path.join(process.cwd(), video.fileUrl);
  videoService.streamVideo(filePath, req, res, video.mimeType);
});

// 7. Initiate AI Analysis
app.post('/api/videos/:id/analyze', async (req: Request, res: Response) => {
  const videoId = req.params.id;
  const video = db.getVideo(videoId);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // Update status to processing
  db.updateVideoStatus(videoId, 'processing', { progress: 15 });
  db.addActivity({
    videoId,
    videoName: video.fileName,
    type: 'analysis_started',
    message: `Started Gemini AI video understanding and event indexing for "${video.fileName}"`,
    timestamp: new Date().toISOString()
  });

  res.json({ message: 'Analysis initiated', status: 'processing' });

  // Execute asynchronously
  (async () => {
    try {
      const filePath = path.join(process.cwd(), video.fileUrl);
      const analysis = await geminiService.analyzeVideo(
        video,
        filePath,
        (step, progress) => {
          db.updateVideoStatus(videoId, step, { progress });
        }
      );

      db.saveAnalysis(analysis);
      db.updateVideoStatus(videoId, 'completed', { progress: 100, eventCount: analysis.events.length });
      db.addActivity({
        videoId,
        videoName: video.fileName,
        type: 'analysis_completed',
        message: `Completed analysis for "${video.fileName}": extracted ${analysis.events.length} events, summary, and entities.`,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[API] Analysis execution failed:', err);
      db.updateVideoStatus(videoId, 'failed', { error: err.message || 'AI analysis failed' });
    }
  })();
});

// 8. Get Analysis Result
app.get('/api/videos/:id/analysis', (req: Request, res: Response) => {
  const videoId = req.params.id;
  const analysis = db.getAnalysis(videoId);
  if (!analysis) {
    return res.status(404).json({ error: 'No analysis found for this video' });
  }
  res.json(analysis);
});

// 9. Get Events for a video
app.get('/api/videos/:id/events', (req: Request, res: Response) => {
  const videoId = req.params.id;
  const events = db.getEvents(videoId);
  res.json(events);
});

// 10. Get all recent events across all videos
app.get('/api/events/recent', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const events = db.getAllRecentEvents(limit);
  res.json(events);
});

// 11. Rename video
app.patch('/api/videos/:id', (req: Request, res: Response) => {
  const { fileName } = req.body;
  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'Valid fileName is required' });
  }
  const success = db.updateVideoName(req.params.id, fileName.trim());
  if (!success) {
    return res.status(404).json({ error: 'Video not found' });
  }
  res.json(db.getVideo(req.params.id));
});

// 12. Delete video
app.delete('/api/videos/:id', (req: Request, res: Response) => {
  const success = db.deleteVideo(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Video not found' });
  }
  res.json({ success: true, message: 'Video and associated intelligence deleted' });
});

// 13. Chat with AI about Video
app.post('/api/videos/:id/chat', async (req: Request, res: Response) => {
  const videoId = req.params.id;
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ error: 'Question cannot be empty' });
  }

  const video = db.getVideo(videoId);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const analysis = db.getAnalysis(videoId);
  if (!analysis) {
    return res.status(400).json({
      error: 'Video must be analysed before conversational assistant can answer questions. Please initiate analysis first.'
    });
  }

  // Save user message
  const userMsg: ChatMessage = {
    id: `msg_${Date.now()}_u`,
    videoId,
    sender: 'user',
    text: question.trim(),
    referencedTimestamps: [],
    timestamp: new Date().toISOString()
  };
  db.addChatMessage(userMsg);

  try {
    const history = db.getChatHistory(videoId);
    const result = await geminiService.answerQuestion(video, analysis, history, question.trim());

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}_a`,
      videoId,
      sender: 'assistant',
      text: result.answer,
      referencedTimestamps: result.timestamps,
      timestamp: new Date().toISOString()
    };
    db.addChatMessage(assistantMsg);

    res.json(assistantMsg);
  } catch (err: any) {
    console.error('[API] Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate answer' });
  }
});

// 14. Get Chat History
app.get('/api/videos/:id/chat/history', (req: Request, res: Response) => {
  const history = db.getChatHistory(req.params.id);
  res.json(history);
});

// 15. Get System Activities
app.get('/api/activities', (_req: Request, res: Response) => {
  const activities = db.getActivities(25);
  res.json(activities);
});

// --- Vite Middleware Integration ---
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VISIONX] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
