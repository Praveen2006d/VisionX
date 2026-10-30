import React from 'react';
import { Search, Bell, CircleCheck, AlertCircle, RefreshCw, Film } from 'lucide-react';
import { VideoRecord, SystemHealth } from '../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  videos: VideoRecord[];
  selectedVideoId: string | null;
  onSelectVideo: (id: string) => void;
  systemHealth?: SystemHealth | null;
  onRefresh?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  videos,
  selectedVideoId,
  onSelectVideo,
  systemHealth,
  onRefresh,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="h-16 bg-white border-b border-[#E1E5E9] px-6 flex items-center justify-between shrink-0">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg font-bold text-[#20252B] leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#68717C] font-normal">{subtitle}</p>}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3.5">
        {/* Search bar */}
        {onSearchChange !== undefined && (
          <div className="relative w-64 hidden sm:block">
            <Search className="w-4 h-4 text-[#68717C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search footage, events..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F5F6F7] border border-[#E1E5E9] rounded-md text-xs text-[#20252B] focus:outline-none focus:border-[#2675B9] focus:bg-white transition-all"
            />
          </div>
        )}

        {/* Video Selector Dropdown if multiple videos exist */}
        {videos.length > 0 && (
          <div className="flex items-center space-x-2 bg-[#F5F6F7] border border-[#E1E5E9] px-2.5 py-1.5 rounded-md">
            <Film className="w-3.5 h-3.5 text-[#2675B9]" />
            <select
              value={selectedVideoId || ''}
              onChange={(e) => onSelectVideo(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#20252B] focus:outline-none max-w-[180px] truncate cursor-pointer"
            >
              <option value="" disabled>
                Select target video...
              </option>
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.fileName} ({v.status === 'completed' ? `${v.eventCount || 0} events` : v.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* System Health Pill */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F5F6F7] border border-[#E1E5E9] rounded text-[11px] font-medium text-[#20252B]">
          {systemHealth?.geminiConnected ? (
            <>
              <CircleCheck className="w-3.5 h-3.5 text-[#39845A]" />
              <span>Gemini 3.8 / 4 Ready</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-[#D69A36]" />
              <span>Local Analytics Mode</span>
            </>
          )}
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh application data"
            className="p-1.5 rounded-md text-[#68717C] hover:text-[#20252B] hover:bg-[#F5F6F7] border border-[#E1E5E9] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Icon */}
        <div className="relative">
          <button className="p-1.5 rounded-md text-[#68717C] hover:text-[#20252B] hover:bg-[#F5F6F7] border border-[#E1E5E9] transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <span className="w-2 h-2 rounded-full bg-[#2675B9] absolute top-1 right-1" />
        </div>
      </div>
    </header>
  );
};
