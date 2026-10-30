import React, { useState } from 'react';
import {
  Film,
  Search,
  Filter,
  Play,
  Cpu,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreVertical,
  Plus
} from 'lucide-react';
import { VideoRecord } from '../types';
import { formatTimestamp, formatFileSize } from '../utils/videoUtils';
import { RenameModal } from './RenameModal';

interface VideoLibraryViewProps {
  videos: VideoRecord[];
  onSelectVideo: (videoId: string, targetTab?: 'analysis' | 'timeline' | 'assistant') => void;
  onAnalyzeVideo: (videoId: string) => Promise<void>;
  onDeleteVideo: (videoId: string) => Promise<void>;
  onRenameVideo: (videoId: string, newName: string) => Promise<void>;
  onNavigateUpload: () => void;
}

export const VideoLibraryView: React.FC<VideoLibraryViewProps> = ({
  videos,
  onSelectVideo,
  onAnalyzeVideo,
  onDeleteVideo,
  onRenameVideo,
  onNavigateUpload
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'uploadDate' | 'duration' | 'fileName' | 'events'>('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [videoToRename, setVideoToRename] = useState<VideoRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter & Search
  const filtered = videos.filter((v) => {
    const matchesSearch =
      v.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && v.status === 'completed') ||
      (statusFilter === 'processing' && ['processing', 'generating_summary', 'indexing_events'].includes(v.status)) ||
      (statusFilter === 'uploaded' && v.status === 'uploaded') ||
      (statusFilter === 'failed' && v.status === 'failed');

    return matchesSearch && matchesStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'uploadDate') {
      cmp = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
    } else if (sortField === 'duration') {
      cmp = a.duration - b.duration;
    } else if (sortField === 'fileName') {
      cmp = a.fileName.localeCompare(b.fileName);
    } else if (sortField === 'events') {
      cmp = (a.eventCount || 0) - (b.eventCount || 0);
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" and all associated intelligence?`)) {
      setDeletingId(id);
      try {
        await onDeleteVideo(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getStatusBadge = (status: VideoRecord['status'], progress?: number) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#39845A]/10 text-[#39845A] border border-[#39845A]/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Analysed</span>
          </span>
        );
      case 'processing':
      case 'generating_summary':
      case 'indexing_events':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#2675B9]/10 text-[#2675B9] border border-[#2675B9]/30">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Analyzing {progress ? `(${progress}%)` : ''}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#C94B45]/10 text-[#C94B45] border border-[#C94B45]/30">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'uploaded':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#68717C]/10 text-[#68717C] border border-[#E1E5E9]">
            <span>Ready for Analysis</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner and Quick Ingestion CTA */}
      <div className="bg-white p-5 rounded-lg border border-[#E1E5E9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#20252B]">Video Surveillance Library</h2>
          <p className="text-xs text-[#68717C] mt-0.5">
            Manage ingested footage, inspect previously generated video intelligence, and run Gemini analysis.
          </p>
        </div>

        <button
          onClick={onNavigateUpload}
          className="flex items-center space-x-2 px-3.5 py-2 bg-[#2675B9] hover:bg-[#1E6099] text-white rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest New Video</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E1E5E9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#68717C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search footage by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F5F6F7] border border-[#E1E5E9] rounded-md text-[#20252B] focus:outline-none focus:border-[#2675B9] focus:bg-white"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#68717C] font-medium hidden md:inline">Status:</span>
          {['all', 'completed', 'uploaded', 'processing'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 text-xs rounded font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-[#2675B9] text-white font-semibold'
                  : 'bg-[#F5F6F7] text-[#68717C] hover:bg-[#E1E5E9] hover:text-[#20252B]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Table */}
      <div className="bg-white rounded-lg border border-[#E1E5E9] overflow-hidden shadow-xs">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-[#68717C] text-xs space-y-3">
            <Film className="w-10 h-10 text-[#D0D5DD] mx-auto" />
            <div>
              <p className="font-semibold text-[#20252B] text-sm">No Videos Found</p>
              <p className="mt-1">
                {videos.length === 0
                  ? 'No video footage has been ingested yet. Upload an MP4/MOV/WebM video or load benchmark footage.'
                  : 'No videos match the selected search or status filters.'}
              </p>
            </div>
            {videos.length === 0 && (
              <button
                onClick={onNavigateUpload}
                className="mt-2 inline-flex items-center space-x-2 px-3.5 py-2 bg-[#2675B9] text-white rounded text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Video</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5F6F7] border-b border-[#E1E5E9] text-[#68717C] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Footage / Title</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Resolution</th>
                  <th className="py-3 px-3">File Size</th>
                  <th className="py-3 px-3">Ingested On</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Events</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E5E9]">
                {sorted.map((video) => (
                  <tr
                    key={video.id}
                    className="hover:bg-[#F9FAFB] transition-colors group"
                  >
                    {/* Footage Name & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          onClick={() => onSelectVideo(video.id, 'analysis')}
                          className="w-14 h-9 bg-black rounded overflow-hidden shrink-0 flex items-center justify-center border border-[#E1E5E9] cursor-pointer group-hover:border-[#2675B9] transition-all relative"
                        >
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.fileName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Film className="w-4 h-4 text-[#A0A8B2]" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-3.5 h-3.5 text-white fill-white" />
                          </div>
                        </div>

                        <div className="min-w-0 max-w-xs">
                          <button
                            onClick={() => onSelectVideo(video.id, 'analysis')}
                            className="font-bold text-[#20252B] hover:text-[#2675B9] truncate text-left block text-xs"
                            title={video.fileName}
                          >
                            {video.fileName}
                          </button>
                          <span className="text-[10px] text-[#68717C] font-mono block">
                            ID: {video.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-3 font-mono text-[#20252B] font-medium">
                      {formatTimestamp(video.duration)}
                    </td>

                    {/* Resolution */}
                    <td className="py-3 px-3 font-mono text-[#68717C]">
                      {video.width || 1920}x{video.height || 1080}
                    </td>

                    {/* File Size */}
                    <td className="py-3 px-3 text-[#68717C]">
                      {formatFileSize(video.fileSize)}
                    </td>

                    {/* Ingestion Date */}
                    <td className="py-3 px-3 text-[#68717C]">
                      {new Date(video.uploadDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {getStatusBadge(video.status, video.statusProgress)}
                    </td>

                    {/* Identified Events Count */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-[#20252B] px-2 py-0.5 rounded bg-[#F5F6F7] border border-[#E1E5E9]">
                        {video.eventCount || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {video.status === 'completed' ? (
                          <button
                            onClick={() => onSelectVideo(video.id, 'analysis')}
                            className="px-2.5 py-1 bg-[#E8F1F8] text-[#2675B9] hover:bg-[#2675B9] hover:text-white rounded text-[11px] font-semibold transition-colors"
                            title="View Analysis & Timeline"
                          >
                            View Analysis
                          </button>
                        ) : (
                          <button
                            onClick={() => onAnalyzeVideo(video.id)}
                            disabled={['processing', 'generating_summary', 'indexing_events'].includes(video.status)}
                            className="px-2.5 py-1 bg-[#2675B9] hover:bg-[#1E6099] text-white rounded text-[11px] font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1"
                            title="Run Gemini AI Video Intelligence"
                          >
                            <Cpu className="w-3 h-3" />
                            <span>Analyse</span>
                          </button>
                        )}

                        <button
                          onClick={() => setVideoToRename(video)}
                          className="p-1 rounded text-[#68717C] hover:text-[#20252B] hover:bg-[#F5F6F7] transition-colors"
                          title="Rename Video"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(video.id, video.fileName)}
                          disabled={deletingId === video.id}
                          className="p-1 rounded text-[#68717C] hover:text-[#C94B45] hover:bg-[#C94B45]/10 transition-colors disabled:opacity-50"
                          title="Delete Video Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {videoToRename && (
        <RenameModal
          video={videoToRename}
          isOpen={Boolean(videoToRename)}
          onClose={() => setVideoToRename(null)}
          onRename={onRenameVideo}
        />
      )}
    </div>
  );
};
