import React from 'react';
import {
  Film,
  Cpu,
  Clock,
  Activity,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { VideoRecord, VideoAnalysis, VideoEvent, SystemActivity } from '../types';
import { formatTimestamp, formatFileSize, getSeverityStyle } from '../utils/videoUtils';

interface DashboardViewProps {
  videos: VideoRecord[];
  analyses: VideoAnalysis[];
  recentEvents: (VideoEvent & { videoName: string; videoId: string })[];
  activities: SystemActivity[];
  onSelectVideo: (videoId: string, targetTab?: 'analysis' | 'timeline' | 'assistant') => void;
  onNavigateTab: (tab: 'upload' | 'library' | 'analysis') => void;
  onLoadSample: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  videos,
  analyses,
  recentEvents,
  activities,
  onSelectVideo,
  onNavigateTab,
  onLoadSample
}) => {
  // Real stats calculation
  const totalVideos = videos.length;
  const videosAnalysed = videos.filter((v) => v.status === 'completed').length;
  const totalEvents = analyses.reduce((acc, a) => acc + (a.events?.length || 0), 0) ||
    videos.reduce((acc, v) => acc + (v.eventCount || 0), 0);
  const totalAnalysisTimeSec = Math.round(
    analyses.reduce((acc, a) => acc + (a.analysisDurationMs || 0), 0) / 1000
  );

  const recentVideos = videos.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Videos */}
        <div className="bg-white p-5 rounded-lg border border-[#E1E5E9] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#68717C] uppercase tracking-wider">
              Total Ingested
            </p>
            <h3 className="text-2xl font-bold text-[#20252B] mt-1 font-mono">{totalVideos}</h3>
            <p className="text-[11px] text-[#68717C] mt-0.5">Surveillance streams</p>
          </div>
          <div className="w-11 h-11 rounded bg-[#E8F1F8] text-[#2675B9] flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Videos Analysed */}
        <div className="bg-white p-5 rounded-lg border border-[#E1E5E9] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#68717C] uppercase tracking-wider">
              Videos Analysed
            </p>
            <h3 className="text-2xl font-bold text-[#39845A] mt-1 font-mono">{videosAnalysed}</h3>
            <p className="text-[11px] text-[#68717C] mt-0.5">
              {totalVideos > 0 ? `${Math.round((videosAnalysed / totalVideos) * 100)}% coverage` : 'Awaiting footage'}
            </p>
          </div>
          <div className="w-11 h-11 rounded bg-[#39845A]/10 text-[#39845A] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Events Identified */}
        <div className="bg-white p-5 rounded-lg border border-[#E1E5E9] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#68717C] uppercase tracking-wider">
              Events Identified
            </p>
            <h3 className="text-2xl font-bold text-[#20252B] mt-1 font-mono">{totalEvents}</h3>
            <p className="text-[11px] text-[#68717C] mt-0.5">Indexed timeline markers</p>
          </div>
          <div className="w-11 h-11 rounded bg-[#D69A36]/10 text-[#D69A36] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Analysis Time */}
        <div className="bg-white p-5 rounded-lg border border-[#E1E5E9] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#68717C] uppercase tracking-wider">
              AI Processing Time
            </p>
            <h3 className="text-2xl font-bold text-[#20252B] mt-1 font-mono">
              {totalAnalysisTimeSec > 60
                ? `${Math.floor(totalAnalysisTimeSec / 60)}m ${totalAnalysisTimeSec % 60}s`
                : `${totalAnalysisTimeSec}s`}
            </h3>
            <p className="text-[11px] text-[#68717C] mt-0.5">Gemini GPU inference</p>
          </div>
          <div className="w-11 h-11 rounded bg-[#E8F1F8] text-[#2675B9] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E1E5E9] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-[#20252B] uppercase tracking-wider">Quick Actions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('upload')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#2675B9] hover:bg-[#1E6099] text-white rounded text-xs font-semibold transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload New Video</span>
          </button>
          <button
            onClick={() => onNavigateTab('library')}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-[#E1E5E9] hover:bg-[#F5F6F7] text-[#20252B] rounded text-xs font-medium transition-colors"
          >
            <Film className="w-3.5 h-3.5 text-[#68717C]" />
            <span>Open Video Library</span>
          </button>
          <button
            onClick={onLoadSample}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#E8F1F8] text-[#2675B9] hover:bg-[#2675B9] hover:text-white rounded text-xs font-semibold transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Load Benchmark CCTV Footage</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Section A (Recent Videos) & Section B (Recent Events) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Videos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-[#E1E5E9] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E5E9] mb-4">
              <div className="flex items-center space-x-2">
                <Film className="w-4 h-4 text-[#2675B9]" />
                <h3 className="text-sm font-bold text-[#20252B]">Recent Ingested Footage</h3>
              </div>
              <button
                onClick={() => onNavigateTab('library')}
                className="text-xs text-[#2675B9] hover:underline font-semibold flex items-center space-x-1"
              >
                <span>View all ({totalVideos})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentVideos.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#68717C]">
                <Film className="w-8 h-8 text-[#D0D5DD] mx-auto mb-2" />
                <p className="font-semibold text-[#20252B]">No video footage available</p>
                <p className="mt-0.5">Upload a video to initiate automated intelligence analysis.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVideos.map((video) => (
                  <div
                    key={video.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border border-[#E1E5E9] hover:border-[#B8C2CC] hover:bg-[#F9FAFB] transition-all gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-14 h-9 bg-black rounded overflow-hidden shrink-0 flex items-center justify-center border border-[#E1E5E9]">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.fileName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film className="w-4 h-4 text-[#A0A8B2]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#20252B] truncate" title={video.fileName}>
                          {video.fileName}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-[#68717C] font-mono mt-0.5">
                          <span>{formatTimestamp(video.duration)}</span>
                          <span>•</span>
                          <span>{formatFileSize(video.fileSize)}</span>
                          <span>•</span>
                          <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                            video.status === 'completed'
                              ? 'bg-[#39845A]/10 text-[#39845A] border-[#39845A]/30'
                              : 'bg-[#68717C]/10 text-[#68717C] border-[#E1E5E9]'
                          }`}
                        >
                          {video.status === 'completed'
                            ? `${video.eventCount || 0} events`
                            : video.status}
                        </span>
                      </div>

                      <button
                        onClick={() => onSelectVideo(video.id, 'analysis')}
                        className="px-3 py-1 bg-[#2675B9] hover:bg-[#1E6099] text-white rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>View Analysis</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section C: System Activity Log */}
          <div className="bg-white rounded-lg border border-[#E1E5E9] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E5E9] mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#2675B9]" />
                <h3 className="text-sm font-bold text-[#20252B]">System Audit & Activity</h3>
              </div>
              <span className="text-[11px] font-mono text-[#68717C]">Realtime Event Log</span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-[#68717C] text-center py-4">No recent activity recorded.</p>
              ) : (
                activities.slice(0, 8).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start space-x-2.5 p-2 rounded bg-[#F5F6F7] text-xs text-[#20252B]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2675B9] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="leading-snug">{act.message}</p>
                      <span className="text-[10px] text-[#68717C] font-mono mt-0.5 block">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Section B (Recent Identified Events) */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#E1E5E9] p-5 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E5E9] mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#2675B9]" />
                <h3 className="text-sm font-bold text-[#20252B]">Recent Identified Events</h3>
              </div>
              <span className="text-[11px] text-[#68717C] font-semibold">{recentEvents.length} items</span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[580px] pr-1">
              {recentEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#68717C]">
                  <Clock className="w-8 h-8 text-[#D0D5DD] mx-auto mb-2" />
                  <p className="font-semibold text-[#20252B]">No events identified yet</p>
                  <p className="mt-0.5">Ingest footage and initiate analysis to populate event detections.</p>
                </div>
              ) : (
                recentEvents.map((ev, idx) => {
                  const style = getSeverityStyle(ev.severity);
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectVideo(ev.videoId, 'timeline')}
                      className="p-3 rounded-md border border-[#E1E5E9] hover:border-[#2675B9] bg-white hover:bg-[#F9FAFB] cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded bg-[#20252B] text-white font-mono text-[11px] font-bold">
                          {formatTimestamp(ev.timestamp)}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-[#68717C] bg-[#F5F6F7] px-1.5 py-0.2 rounded border border-[#E1E5E9]">
                            {ev.category}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${style.badge}`}>
                            {ev.severity}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-[#20252B] leading-tight">
                        {ev.event}
                      </p>

                      <p className="text-[11px] text-[#68717C] line-clamp-2">
                        {ev.description}
                      </p>

                      <div className="pt-1 border-t border-[#E1E5E9]/60 flex items-center justify-between text-[10px] text-[#68717C]">
                        <span className="truncate max-w-[150px] font-medium text-[#20252B]">
                          {ev.videoName}
                        </span>
                        <span className="font-mono">Conf: {Math.round(ev.confidence * 100)}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
