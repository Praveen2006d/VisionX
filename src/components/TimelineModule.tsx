import React, { useState } from 'react';
import {
  Clock,
  Filter,
  Search,
  User,
  Activity,
  Box,
  AlertTriangle,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { VideoEvent, EventCategory } from '../types';
import { formatTimestamp, filterEvents, getSeverityStyle } from '../utils/videoUtils';

interface TimelineModuleProps {
  events: VideoEvent[];
  currentTime?: number;
  selectedEventId?: string | null;
  onSelectEvent: (event: VideoEvent) => void;
}

export const TimelineModule: React.FC<TimelineModuleProps> = ({
  events,
  currentTime = 0,
  selectedEventId,
  onSelectEvent
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: (EventCategory | 'All')[] = [
    'All',
    'People',
    'Movement',
    'Objects',
    'Important Events',
    'Scene Changes'
  ];

  const filteredEvents = filterEvents(events, selectedCategory, searchQuery);

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'People':
        return <User className="w-3.5 h-3.5" />;
      case 'Movement':
        return <Activity className="w-3.5 h-3.5" />;
      case 'Objects':
        return <Box className="w-3.5 h-3.5" />;
      case 'Important Events':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'Scene Changes':
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#E1E5E9] p-5 flex flex-col h-full space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E1E5E9]">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#2675B9]" />
            <h3 className="text-sm font-bold text-[#20252B]">Event Timeline</h3>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#E8F1F8] text-[#2675B9] font-semibold">
              {filteredEvents.length} events
            </span>
          </div>
          <p className="text-[11px] text-[#68717C] mt-0.5">
            Click any event or timestamp to seek playback to that exact frame.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-[#68717C] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter event descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#F5F6F7] border border-[#E1E5E9] rounded focus:outline-none focus:border-[#2675B9] focus:bg-white text-[#20252B]"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5 pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-[#2675B9] text-white font-semibold shadow-xs'
                : 'bg-[#F5F6F7] text-[#68717C] hover:bg-[#E1E5E9] hover:text-[#20252B]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px]">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-[#68717C] text-xs">
            <Clock className="w-8 h-8 text-[#D0D5DD] mx-auto mb-2" />
            <p className="font-semibold text-[#20252B]">No events match criteria</p>
            <p className="mt-0.5">Try clearing the search query or selecting "All" categories.</p>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isSelected = selectedEventId === ev.id;
            // Check if current video playback is currently inside this event span
            const isCurrentInSpan =
              currentTime >= ev.startTime - 0.5 && currentTime <= ev.endTime + 0.5;
            const style = getSeverityStyle(ev.severity);

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className={`p-3 rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E8F1F8]/70 border-[#2675B9] shadow-xs'
                    : isCurrentInSpan
                    ? 'bg-[#F5F6F7] border-[#2675B9]/60'
                    : 'bg-white border-[#E1E5E9] hover:border-[#B8C2CC] hover:bg-[#F9FAFB]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Left: Timestamp Jump Button & Title */}
                  <div className="flex items-start space-x-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      className="px-2 py-0.5 rounded bg-[#20252B] hover:bg-[#2675B9] text-white font-mono text-xs font-semibold shrink-0 shadow-2xs transition-colors flex items-center space-x-1"
                      title="Jump video to this timestamp"
                    >
                      <Clock className="w-3 h-3 text-[#D0D5DD]" />
                      <span>{formatTimestamp(ev.timestamp)}</span>
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#20252B] leading-tight">
                          {ev.event}
                        </span>
                        {isCurrentInSpan && (
                          <span className="flex items-center space-x-1 text-[10px] text-[#2675B9] font-semibold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2675B9]" />
                            <span>PLAYING NOW</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#68717C] mt-1 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Badges */}
                  <div className="flex flex-col items-end space-y-1 shrink-0">
                    <div className="flex items-center space-x-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F5F6F7] text-[#68717C] border border-[#E1E5E9] flex items-center space-x-1">
                        {getCategoryIcon(ev.category)}
                        <span>{ev.category}</span>
                      </span>

                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${style.badge}`}
                      >
                        {ev.severity}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-[#68717C] font-mono">
                      <span>Span: {formatTimestamp(ev.startTime)} - {formatTimestamp(ev.endTime)}</span>
                      <span>•</span>
                      <span>Conf: {Math.round(ev.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
