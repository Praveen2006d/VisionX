import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  FastForward,
  Film,
  Sparkles
} from 'lucide-react';
import { VideoRecord, VideoEvent } from '../types';
import { formatTimestamp } from '../utils/videoUtils';

interface VideoPlayerProps {
  video: VideoRecord;
  events?: VideoEvent[];
  jumpToTimestamp?: number | null;
  onTimeUpdate?: (currentTime: number) => void;
  onEventClick?: (event: VideoEvent) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  events = [],
  jumpToTimestamp,
  onTimeUpdate,
  onEventClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  // Jump to timestamp when prop changes
  useEffect(() => {
    if (jumpToTimestamp !== null && jumpToTimestamp !== undefined && videoRef.current) {
      videoRef.current.currentTime = jumpToTimestamp;
      setCurrentTime(jumpToTimestamp);
      if (!isPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [jumpToTimestamp]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    if (onTimeUpdate) {
      onTimeUpdate(curr);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && !isNaN(dur)) {
      setDuration(dur);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetDur = duration || video.duration || 120;
    setHoverTime(pos * targetDur);
    setHoverPosition(pos * 100);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetDur = duration || video.duration || 120;
    const time = pos * targetDur;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const totalDur = duration || video.duration || 120;
  const progressPercent = totalDur > 0 ? (currentTime / totalDur) * 100 : 0;

  // Stream URL
  const videoStreamUrl = `/api/videos/${video.id}/stream`;

  return (
    <div
      ref={containerRef}
      className="bg-[#111418] rounded-lg border border-[#E1E5E9] overflow-hidden flex flex-col shadow-sm"
    >
      {/* CCTV / Player Top Overlay Bar */}
      <div className="bg-[#1B2026] px-4 py-2 flex items-center justify-between text-xs text-[#A0A8B2] border-b border-[#2A313A]">
        <div className="flex items-center space-x-2">
          <Film className="w-3.5 h-3.5 text-[#2675B9]" />
          <span className="font-semibold text-white tracking-wide truncate max-w-xs">
            {video.fileName}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A313A] text-[#D0D5DD] font-mono">
            {video.width || 1920}x{video.height || 1080}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#39845A] animate-pulse" />
            <span className="text-white">STREAM READY</span>
          </span>
          <span className="text-[#68717C]">|</span>
          <span className="text-white font-bold">{formatTimestamp(currentTime)}</span>
          <span className="text-[#68717C]">/</span>
          <span>{formatTimestamp(totalDur)}</span>
        </div>
      </div>

      {/* Video Canvas Container */}
      <div className="relative bg-black flex items-center justify-center min-h-[360px] max-h-[520px] aspect-video group">
        <video
          ref={videoRef}
          src={videoStreamUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
        />

        {/* Big play button overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 hover:scale-105 transition-all shadow-lg"
          >
            <Play className="w-7 h-7 ml-1 fill-white" />
          </button>
        )}
      </div>

      {/* Interactive Timeline Track with Event Markers */}
      <div className="bg-[#1B2026] px-4 pt-3 pb-1">
        <div
          className="relative h-6 flex items-center cursor-pointer group"
          onMouseEnter={() => setIsHoveringTimeline(true)}
          onMouseLeave={() => setIsHoveringTimeline(false)}
          onMouseMove={handleTimelineMouseMove}
          onClick={handleTimelineClick}
        >
          {/* Background Track */}
          <div className="w-full h-1.5 bg-[#2A313A] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#2675B9] transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Event Markers on Timeline */}
          {events.map((ev) => {
            const markerPos = (ev.timestamp / totalDur) * 100;
            const isHighSeverity = ev.severity === 'High';
            const isMedium = ev.severity === 'Medium';
            const markerColor = isHighSeverity ? '#C94B45' : isMedium ? '#D69A36' : '#2675B9';

            return (
              <div
                key={ev.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.currentTime = ev.timestamp;
                    setCurrentTime(ev.timestamp);
                  }
                  if (onEventClick) onEventClick(ev);
                }}
                title={`[${formatTimestamp(ev.timestamp)}] ${ev.category}: ${ev.event}`}
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full z-10 transition-transform hover:scale-150 cursor-pointer shadow-xs"
                style={{
                  left: `${markerPos}%`,
                  backgroundColor: markerColor,
                  border: '1.5px solid #FFFFFF'
                }}
              />
            );
          })}

          {/* Hover Time Tooltip */}
          {isHoveringTimeline && hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 bg-[#20252B] text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none z-20 border border-white/20"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTimestamp(hoverTime)}
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#1B2026] px-4 py-2.5 flex items-center justify-between text-white border-t border-[#2A313A]">
        {/* Left: Playback controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded hover:bg-[#2A313A] text-white transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            onClick={restartVideo}
            className="p-1.5 rounded hover:bg-[#2A313A] text-[#A0A8B2] hover:text-white transition-colors"
            title="Restart video"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded hover:bg-[#2A313A] text-[#A0A8B2] hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-[#2A313A] accent-[#2675B9] rounded-lg cursor-pointer"
            />
          </div>

          {/* Timestamp Display */}
          <div className="text-xs font-mono text-[#D0D5DD] pl-2">
            <span className="font-semibold text-white">{formatTimestamp(currentTime)}</span>
            <span className="text-[#68717C] mx-1">/</span>
            <span>{formatTimestamp(totalDur)}</span>
          </div>
        </div>

        {/* Right: Playback Speed & Fullscreen */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-[#2A313A] rounded px-1.5 py-0.5">
            {[0.5, 1, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  playbackRate === speed
                    ? 'bg-[#2675B9] text-white font-bold'
                    : 'text-[#A0A8B2] hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-[#2A313A] text-[#A0A8B2] hover:text-white transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
