import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

const execAsync = promisify(exec);
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const THUMBNAILS_DIR = path.resolve(process.cwd(), 'uploads', 'thumbnails');

if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

export interface ExtractedMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  fps: number;
  codec: string;
}

export class VideoService {
  /**
   * Extracts metadata (duration, width, height, fps) using ffprobe
   */
  public async extractMetadata(filePath: string): Promise<ExtractedMetadata> {
    const defaultMeta: ExtractedMetadata = {
      duration: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264'
    };

    try {
      const cmd = `ffprobe -v error -show_entries format=duration,size:stream=width,height,r_frame_rate,codec_name -of json "${filePath}"`;
      const { stdout } = await execAsync(cmd);
      const data = JSON.parse(stdout);

      const stream = data.streams?.[0] || {};
      const format = data.format || {};

      let fps = 30;
      if (stream.r_frame_rate && stream.r_frame_rate.includes('/')) {
        const [num, den] = stream.r_frame_rate.split('/').map(Number);
        if (den && num) fps = Math.round(num / den);
      }

      return {
        duration: Math.round(parseFloat(format.duration || stream.duration || '120')) || 120,
        width: stream.width || 1920,
        height: stream.height || 1080,
        fps: fps || 30,
        codec: stream.codec_name || 'h264'
      };
    } catch (err) {
      console.warn('[VideoService] ffprobe extraction failed, returning default metadata:', err);
      return defaultMeta;
    }
  }

  /**
   * Generates a video thumbnail at a given timestamp using ffmpeg
   */
  public async generateThumbnail(filePath: string, videoId: string, timestampSec = 2): Promise<string> {
    const thumbFileName = `thumb_${videoId}.jpg`;
    const outputPath = path.join(THUMBNAILS_DIR, thumbFileName);

    try {
      const cmd = `ffmpeg -ss ${timestampSec} -i "${filePath}" -vframes 1 -q:v 2 -y "${outputPath}"`;
      await execAsync(cmd);
      return `/uploads/thumbnails/${thumbFileName}`;
    } catch (err) {
      console.warn('[VideoService] ffmpeg thumbnail generation failed:', err);
      return '';
    }
  }

  /**
   * Generates a realistic 120-second CCTV surveillance test video with embedded timecode
   * and moving targets to allow instant demonstration of the VISIONX system
   */
  public async generateSampleCctvVideo(): Promise<{
    filePath: string;
    fileName: string;
    duration: number;
    size: number;
    thumbnailUrl: string;
  }> {
    const sampleFileName = `cctv_entrance_cam04.mp4`;
    const filePath = path.join(UPLOADS_DIR, sampleFileName);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const thumbUrl = await this.generateThumbnail(filePath, 'sample_cctv', 4);
      return {
        filePath,
        fileName: sampleFileName,
        duration: 120,
        size: stats.size,
        thumbnailUrl: thumbUrl
      };
    }

    console.log('[VideoService] Generating sample CCTV footage with FFmpeg...');
    try {
      // Create a 120-second synthetic security camera video with timestamp overlay and optical motion
      const cmd = `ffmpeg -f lavfi -i "testsrc=duration=120:size=1280x720:rate=25" \
        -vf "drawbox=x=0:y=0:w=1280:h=60:color=black@0.7:t=fill, \
             drawtext=text='VISIONX CCTV - CAM 04 ENTRANCE NORTH - 1080P HD':fontcolor=white:fontsize=22:x=20:y=18, \
             drawtext=text='%{pts\\:hms}':fontcolor=yellow:fontsize=24:x=1140:y=18, \
             drawbox=x=100+10*t:y=300+sin(t)*50:w=80:h=160:color=blue@0.6:t=fill, \
             drawtext=text='TARGET 01 [WALK/RUN]':fontcolor=white:fontsize=16:x=100+10*t:y=270" \
        -c:v libx264 -pix_fmt yuv420p -preset ultrafast -t 120 -y "${filePath}"`;

      await execAsync(cmd);
      const stats = fs.statSync(filePath);
      const thumbUrl = await this.generateThumbnail(filePath, 'sample_cctv', 5);

      return {
        filePath,
        fileName: sampleFileName,
        duration: 120,
        size: stats.size,
        thumbnailUrl: thumbUrl
      };
    } catch (err) {
      console.error('[VideoService] Failed to synthesize sample video with FFmpeg:', err);
      throw err;
    }
  }

  /**
   * HTTP 206 Partial Content video streaming for smooth seeking and scrubbing
   */
  public streamVideo(filePath: string, req: Request, res: Response, mimeType = 'video/mp4'): void {
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Video file not found' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }
}

export const videoService = new VideoService();
