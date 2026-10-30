import React, { useState, useEffect } from 'react';
import {
  Cpu,
  FileText,
  Clock,
  MessageSquare,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Loader2,
  Film,
  Play,
  CheckCircle2
} from 'lucide-react';
import { VideoRecord, VideoAnalysis, VideoEvent, ChatMessage } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { SummaryModule } from './SummaryModule';
import { TimelineModule } from './TimelineModule';
import { AssistantChatModule } from './AssistantChatModule';

interface AnalysisWorkspaceViewProps {
  video: VideoRecord;
  analysis: VideoAnalysis | null;
  chatHistory: ChatMessage[];
  defaultSubTab?: 'summary' | 'timeline' | 'assistant';
  onRunAnalysis: (videoId: string) => Promise<void>;
  onSendMessage: (question: string) => Promise<void>;
  isSendingChat: boolean;
  onNavigateLibrary: () => void;
}

export const AnalysisWorkspaceView: React.FC<AnalysisWorkspaceViewProps> = ({
  video,
  analysis,
  chatHistory,
  defaultSubTab = 'timeline',
  onRunAnalysis,
  onSendMessage,
  isSendingChat,
  onNavigateLibrary
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'summary' | 'assistant'>(
    defaultSubTab
  );
  const [jumpToTimestamp, setJumpToTimestamp] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Sync default tab if passed from outside
  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  const handleEventClick = (event: VideoEvent) => {
    setSelectedEventId(event.id);
    setJumpToTimestamp(event.timestamp);
  };

  const handleJumpFromAssistant = (seconds: number) => {
    setJumpToTimestamp(seconds);
    // Find matching event if any
    if (analysis) {
      const match = analysis.events.find(
        (e) => Math.abs(e.timestamp - seconds) <= 2 || (seconds >= e.startTime && seconds <= e.endTime)
      );
      if (match) setSelectedEventId(match.id);
    }
  };

  const isAnalyzing = ['processing', 'generating_summary', 'indexing_events'].includes(video.status);

  return (
    <div className="space-y-5">
      {/* Target Video Header & Analysis Control Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E1E5E9] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-[#E8F1F8] text-[#2675B9]">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-[#20252B] truncate max-w-md" title={video.fileName}>
                {video.fileName}
              </h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                  video.status === 'completed'
                    ? 'bg-[#39845A]/10 text-[#39845A] border-[#39845A]/30'
                    : isAnalyzing
                    ? 'bg-[#2675B9]/10 text-[#2675B9] border-[#2675B9]/30'
                    : 'bg-[#68717C]/10 text-[#68717C] border-[#E1E5E9]'
                }`}
              >
                {video.status === 'completed'
                  ? 'Analysis Complete'
                  : isAnalyzing
                  ? `Processing (${video.statusProgress || 25}%)`
                  : 'Ready for Analysis'}
              </span>
            </div>
            <p className="text-xs text-[#68717C] mt-0.5 font-mono">
              Duration: {Math.round(video.duration)}s • Resolution: {video.width || 1920}x{video.height || 1080} • Ingested: {new Date(video.uploadDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center space-x-2">
          {video.status === 'completed' ? (
            <button
              onClick={() => onRunAnalysis(video.id)}
              disabled={isAnalyzing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#F5F6F7] hover:bg-[#E1E5E9] text-[#20252B] border border-[#E1E5E9] text-xs font-semibold transition-colors disabled:opacity-50"
              title="Re-run Gemini AI intelligence analysis"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#68717C]" />
              <span>Re-analyze</span>
            </button>
          ) : (
            <button
              onClick={() => onRunAnalysis(video.id)}
              disabled={isAnalyzing}
              className="flex items-center space-x-2 px-4 py-2 rounded bg-[#2675B9] hover:bg-[#1E6099] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Video...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Run AI Video Analysis</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onNavigateLibrary}
            className="px-3 py-1.5 rounded border border-[#E1E5E9] text-[#68717C] hover:bg-[#F5F6F7] hover:text-[#20252B] text-xs font-medium transition-colors"
          >
            Video Library
          </button>
        </div>
      </div>

      {/* Live Analysis Progress Banner if analyzing */}
      {isAnalyzing && (
        <div className="bg-white p-5 rounded-lg border border-[#2675B9]/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#20252B]">
            <div className="flex items-center space-x-2 text-[#2675B9]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {video.status === 'generating_summary'
                  ? 'Generating Comprehensive Intelligence Summary...'
                  : video.status === 'indexing_events'
                  ? 'Indexing Chronological Events & People Tracking...'
                  : 'Gemini Multimodal Video Understanding in Progress...'}
              </span>
            </div>
            <span className="font-mono text-[#2675B9]">{video.statusProgress || 35}%</span>
          </div>

          <div className="w-full h-2 bg-[#E1E5E9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2675B9] transition-all duration-300 rounded-full"
              style={{ width: `${video.statusProgress || 35}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-[#68717C] pt-1">
            <div className={`p-2 rounded text-center ${video.statusProgress && video.statusProgress >= 25 ? 'bg-[#E8F1F8] text-[#2675B9] font-semibold' : 'bg-[#F5F6F7]'}`}>
              1. Ingestion & Probe
            </div>
            <div className={`p-2 rounded text-center ${video.statusProgress && video.statusProgress >= 55 ? 'bg-[#E8F1F8] text-[#2675B9] font-semibold' : 'bg-[#F5F6F7]'}`}>
              2. Multimodal Extraction
            </div>
            <div className={`p-2 rounded text-center ${video.statusProgress && video.statusProgress >= 85 ? 'bg-[#E8F1F8] text-[#2675B9] font-semibold' : 'bg-[#F5F6F7]'}`}>
              3. Chronological Indexing
            </div>
          </div>
        </div>
      )}

      {/* Workspace Grid: Video Player + Intelligence Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Video Player */}
        <div className="lg:col-span-7 space-y-4">
          <VideoPlayer
            video={video}
            events={analysis?.events || []}
            jumpToTimestamp={jumpToTimestamp}
            onTimeUpdate={(t) => setCurrentTime(t)}
            onEventClick={handleEventClick}
          />

          {/* Quick Jump Legend */}
          {analysis && analysis.events.length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-[#E1E5E9] flex items-center justify-between text-xs text-[#68717C]">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-[#20252B]">Timeline Key:</span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2675B9]" />
                  <span>Low</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D69A36]" />
                  <span>Medium</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C94B45]" />
                  <span>High Severity</span>
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#20252B]">
                {analysis.events.length} markers indexed
              </span>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Intelligence Modules Tabs */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Sub Navigation Tabs */}
          <div className="bg-white p-1 rounded-lg border border-[#E1E5E9] flex items-center shadow-xs">
            <button
              onClick={() => setActiveSubTab('timeline')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                activeSubTab === 'timeline'
                  ? 'bg-[#2675B9] text-white shadow-xs'
                  : 'text-[#68717C] hover:text-[#20252B] hover:bg-[#F5F6F7]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline ({analysis?.events?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('summary')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                activeSubTab === 'summary'
                  ? 'bg-[#2675B9] text-white shadow-xs'
                  : 'text-[#68717C] hover:text-[#20252B] hover:bg-[#F5F6F7]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>

            <button
              onClick={() => setActiveSubTab('assistant')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                activeSubTab === 'assistant'
                  ? 'bg-[#2675B9] text-white shadow-xs'
                  : 'text-[#68717C] hover:text-[#20252B] hover:bg-[#F5F6F7]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>
          </div>

          {/* Module Content */}
          <div className="flex-1 min-h-[480px]">
            {activeSubTab === 'timeline' && (
              <TimelineModule
                events={analysis?.events || []}
                currentTime={currentTime}
                selectedEventId={selectedEventId}
                onSelectEvent={handleEventClick}
              />
            )}

            {activeSubTab === 'summary' && (
              <SummaryModule
                analysis={analysis}
                onRegenerate={() => onRunAnalysis(video.id)}
                isRegenerating={isAnalyzing}
              />
            )}

            {activeSubTab === 'assistant' && (
              <AssistantChatModule
                video={video}
                analysis={analysis}
                history={chatHistory}
                onSendMessage={onSendMessage}
                isLoading={isSendingChat}
                onJumpToTimestamp={handleJumpFromAssistant}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
