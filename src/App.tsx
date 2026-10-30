import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { VideoLibraryView } from './components/VideoLibraryView';
import { UploadView } from './components/UploadView';
import { AnalysisWorkspaceView } from './components/AnalysisWorkspaceView';
import { TimelineModule } from './components/TimelineModule';
import { AssistantChatModule } from './components/AssistantChatModule';
import { SettingsView } from './components/SettingsView';
import { VideoRecord, VideoAnalysis, VideoEvent, ChatMessage, SystemActivity, SystemHealth } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysis | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [recentEvents, setRecentEvents] = useState<(VideoEvent & { videoName: string; videoId: string })[]>([]);
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);

  // Fetch Videos
  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data: VideoRecord[] = await res.json();
        setVideos(data);
        // Default select first video if none selected
        if (data.length > 0 && !selectedVideoId) {
          setSelectedVideoId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  }, [selectedVideoId]);

  // Fetch System Health
  const fetchSystemHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data: SystemHealth = await res.json();
        setSystemHealth(data);
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  }, []);

  // Fetch Activities
  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const data: SystemActivity[] = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  }, []);

  // Fetch Recent Events
  const fetchRecentEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events/recent?limit=15');
      if (res.ok) {
        const data = await res.json();
        setRecentEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch recent events:', err);
    }
  }, []);

  // Fetch Analysis for Selected Video
  const fetchAnalysis = useCallback(async (videoId: string) => {
    try {
      const res = await fetch(`/api/videos/${videoId}/analysis`);
      if (res.ok) {
        const data: VideoAnalysis = await res.json();
        setCurrentAnalysis(data);
      } else {
        setCurrentAnalysis(null);
      }
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
      setCurrentAnalysis(null);
    }
  }, []);

  // Fetch Chat History for Selected Video
  const fetchChatHistory = useCallback(async (videoId: string) => {
    try {
      const res = await fetch(`/api/videos/${videoId}/chat/history`);
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setChatHistory(data);
      } else {
        setChatHistory([]);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
      setChatHistory([]);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchVideos(),
        fetchSystemHealth(),
        fetchActivities(),
        fetchRecentEvents()
      ]);
      setIsLoadingInitial(false);
    };
    init();
  }, [fetchVideos, fetchSystemHealth, fetchActivities, fetchRecentEvents]);

  // When selected video changes, update its analysis and chat
  useEffect(() => {
    if (selectedVideoId) {
      fetchAnalysis(selectedVideoId);
      fetchChatHistory(selectedVideoId);
    } else {
      setCurrentAnalysis(null);
      setChatHistory([]);
    }
  }, [selectedVideoId, fetchAnalysis, fetchChatHistory]);

  // Polling when any video is analyzing
  useEffect(() => {
    const hasActiveAnalysis = videos.some((v) =>
      ['processing', 'generating_summary', 'indexing_events'].includes(v.status)
    );

    if (hasActiveAnalysis) {
      const timer = setInterval(() => {
        fetchVideos();
        if (selectedVideoId) {
          fetchAnalysis(selectedVideoId);
        }
        fetchRecentEvents();
        fetchActivities();
      }, 2500);
      return () => clearInterval(timer);
    }
  }, [videos, selectedVideoId, fetchVideos, fetchAnalysis, fetchRecentEvents, fetchActivities]);

  // Handler: Select a video and switch tab
  const handleSelectVideo = (videoId: string, targetTab: NavItem = 'analysis') => {
    setSelectedVideoId(videoId);
    setCurrentTab(targetTab);
  };

  // Handler: Run AI Analysis
  const handleRunAnalysis = async (videoId: string) => {
    try {
      const res = await fetch(`/api/videos/${videoId}/analyze`, { method: 'POST' });
      if (res.ok) {
        // Immediate local state update
        setVideos((prev) =>
          prev.map((v) => (v.id === videoId ? { ...v, status: 'processing', statusProgress: 15 } : v))
        );
        fetchActivities();
      }
    } catch (err) {
      console.error('Failed to initiate analysis:', err);
    }
  };

  // Handler: Send Chat Question
  const handleSendMessage = async (question: string) => {
    if (!selectedVideoId) return;
    setIsSendingChat(true);

    // Optimistically append user message
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      videoId: selectedVideoId,
      sender: 'user',
      text: question,
      referencedTimestamps: [],
      timestamp: new Date().toISOString()
    };
    setChatHistory((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/videos/${selectedVideoId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (res.ok) {
        const assistantMsg: ChatMessage = await res.json();
        setChatHistory((prev) => [...prev, assistantMsg]);
        fetchActivities();
      } else {
        const errData = await res.json();
        const errMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          videoId: selectedVideoId,
          sender: 'assistant',
          text: `Error: ${errData.error || 'Failed to process inquiry.'}`,
          referencedTimestamps: [],
          timestamp: new Date().toISOString()
        };
        setChatHistory((prev) => [...prev, errMsg]);
      }
    } catch (err: any) {
      console.error('Chat send error:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Handler: Delete Video
  const handleDeleteVideo = async (videoId: string) => {
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: 'DELETE' });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== videoId));
        if (selectedVideoId === videoId) {
          const remaining = videos.filter((v) => v.id !== videoId);
          setSelectedVideoId(remaining.length > 0 ? remaining[0].id : null);
        }
        fetchRecentEvents();
        fetchActivities();
      }
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  // Handler: Rename Video
  const handleRenameVideo = async (videoId: string, newName: string) => {
    const res = await fetch(`/api/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: newName })
    });
    if (!res.ok) {
      throw new Error('Failed to rename video on server');
    }
    const updated = await res.json();
    setVideos((prev) => prev.map((v) => (v.id === videoId ? updated : v)));
  };

  // Handler: Load Benchmark Sample CCTV
  const handleLoadSample = async () => {
    try {
      const res = await fetch('/api/videos/sample', { method: 'POST' });
      if (res.ok) {
        const sampleRecord: VideoRecord = await res.json();
        await fetchVideos();
        setSelectedVideoId(sampleRecord.id);
        setCurrentTab('analysis');
        fetchActivities();
        // Automatically initiate analysis on sample benchmark if not already completed
        if (sampleRecord.status !== 'completed') {
          handleRunAnalysis(sampleRecord.id);
        }
      }
    } catch (err) {
      console.error('Failed to load sample:', err);
    }
  };

  // Currently selected video object
  const activeVideo = videos.find((v) => v.id === selectedVideoId) || (videos.length > 0 ? videos[0] : null);

  // Dynamic Page Header Info
  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Surveillance & Intelligence Overview',
          subtitle: 'Real-time telemetry, active footage ingestion, and AI event detection audit.'
        };
      case 'library':
        return {
          title: 'Video Library & Archives',
          subtitle: 'Repository of ingested surveillance streams and analytical indexes.'
        };
      case 'upload':
        return {
          title: 'Ingest Video Footage',
          subtitle: 'Upload MP4, MOV, or WebM footage for automated multimodal AI reasoning.'
        };
      case 'analysis':
        return {
          title: 'Video Intelligence Analysis Workspace',
          subtitle: 'Synchronized HTML5 video player, timeline markers, and entity extraction.'
        };
      case 'timeline':
        return {
          title: 'Chronological Event Timeline',
          subtitle: 'Frame-accurate chronological activity index with interactive seek triggers.'
        };
      case 'assistant':
        return {
          title: 'Interactive Video Intelligence Assistant',
          subtitle: 'Grounding conversational reasoning directly in observed video events.'
        };
      case 'settings':
      default:
        return {
          title: 'System Settings & Architecture',
          subtitle: 'API connectivity, storage models, and academic prototype specifications.'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F6F7] text-[#20252B] font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        systemHealth={systemHealth}
        selectedVideoName={activeVideo?.fileName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          videos={videos}
          selectedVideoId={selectedVideoId}
          onSelectVideo={(id) => setSelectedVideoId(id)}
          systemHealth={systemHealth}
          onRefresh={() => {
            fetchVideos();
            fetchSystemHealth();
            fetchActivities();
            fetchRecentEvents();
            if (selectedVideoId) fetchAnalysis(selectedVideoId);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentTab === 'dashboard' && (
            <DashboardView
              videos={videos}
              analyses={currentAnalysis ? [currentAnalysis] : []}
              recentEvents={recentEvents}
              activities={activities}
              onSelectVideo={handleSelectVideo}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onLoadSample={handleLoadSample}
            />
          )}

          {currentTab === 'library' && (
            <VideoLibraryView
              videos={videos}
              onSelectVideo={handleSelectVideo}
              onAnalyzeVideo={handleRunAnalysis}
              onDeleteVideo={handleDeleteVideo}
              onRenameVideo={handleRenameVideo}
              onNavigateUpload={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'upload' && (
            <UploadView
              onUploadSuccess={(videoRecord) => {
                fetchVideos();
                setSelectedVideoId(videoRecord.id);
                setCurrentTab('analysis');
              }}
              onLoadSampleSuccess={(sampleRecord) => {
                fetchVideos();
                setSelectedVideoId(sampleRecord.id);
                setCurrentTab('analysis');
                if (sampleRecord.status !== 'completed') {
                  handleRunAnalysis(sampleRecord.id);
                }
              }}
            />
          )}

          {currentTab === 'analysis' && activeVideo && (
            <AnalysisWorkspaceView
              video={activeVideo}
              analysis={currentAnalysis}
              chatHistory={chatHistory}
              defaultSubTab="timeline"
              onRunAnalysis={handleRunAnalysis}
              onSendMessage={handleSendMessage}
              isSendingChat={isSendingChat}
              onNavigateLibrary={() => setCurrentTab('library')}
            />
          )}

          {currentTab === 'analysis' && !activeVideo && (
            <div className="bg-white p-12 rounded-lg border border-[#E1E5E9] text-center max-w-xl mx-auto space-y-4">
              <h3 className="text-sm font-bold text-[#20252B]">No Video Selected for Analysis</h3>
              <p className="text-xs text-[#68717C]">
                Please ingest or select a video to inspect its multimodal analysis and event timeline.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setCurrentTab('upload')}
                  className="px-4 py-2 bg-[#2675B9] text-white rounded text-xs font-semibold shadow-xs"
                >
                  Upload Video
                </button>
                <button
                  onClick={handleLoadSample}
                  className="px-4 py-2 bg-[#E8F1F8] text-[#2675B9] rounded text-xs font-semibold"
                >
                  Load Benchmark CCTV
                </button>
              </div>
            </div>
          )}

          {currentTab === 'timeline' && activeVideo && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-white p-4 rounded-lg border border-[#E1E5E9] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#20252B]">
                    Event Timeline: {activeVideo.fileName}
                  </h3>
                  <p className="text-xs text-[#68717C]">
                    Chronological events extracted by Gemini AI multimodal engine.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('analysis')}
                  className="px-3 py-1.5 bg-[#2675B9] text-white rounded text-xs font-semibold"
                >
                  Open in Synchronized Player
                </button>
              </div>

              <TimelineModule
                events={currentAnalysis?.events || []}
                currentTime={0}
                selectedEventId={null}
                onSelectEvent={(ev) => {
                  setCurrentTab('analysis');
                }}
              />
            </div>
          )}

          {currentTab === 'timeline' && !activeVideo && (
            <div className="bg-white p-8 rounded-lg border border-[#E1E5E9] text-center text-xs text-[#68717C]">
              No video selected. Please upload or select a video from the library.
            </div>
          )}

          {currentTab === 'assistant' && activeVideo && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-white p-4 rounded-lg border border-[#E1E5E9] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#20252B]">
                    Interactive Video Assistant: {activeVideo.fileName}
                  </h3>
                  <p className="text-xs text-[#68717C]">
                    Ask questions grounded in the video's analysis and timeline.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('analysis')}
                  className="px-3 py-1.5 bg-[#2675B9] text-white rounded text-xs font-semibold"
                >
                  Open in Synchronized Player
                </button>
              </div>

              <AssistantChatModule
                video={activeVideo}
                analysis={currentAnalysis}
                history={chatHistory}
                onSendMessage={handleSendMessage}
                isLoading={isSendingChat}
                onJumpToTimestamp={(_ts) => {
                  setCurrentTab('analysis');
                }}
              />
            </div>
          )}

          {currentTab === 'assistant' && !activeVideo && (
            <div className="bg-white p-8 rounded-lg border border-[#E1E5E9] text-center text-xs text-[#68717C]">
              No video selected. Please upload or select a video from the library.
            </div>
          )}

          {currentTab === 'settings' && (
            <SettingsView
              systemHealth={systemHealth}
              onRefreshHealth={fetchSystemHealth}
            />
          )}
        </main>
      </div>
    </div>
  );
}
