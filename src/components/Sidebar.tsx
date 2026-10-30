import React from 'react';
import {
  LayoutDashboard,
  Film,
  UploadCloud,
  Cpu,
  Clock,
  MessageSquare,
  Settings,
  ShieldCheck,
  Activity,
  CircleDot
} from 'lucide-react';
import { SystemHealth } from '../types';

export type NavItem = 
  | 'dashboard'
  | 'library'
  | 'upload'
  | 'analysis'
  | 'timeline'
  | 'assistant'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  systemHealth?: SystemHealth | null;
  selectedVideoName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  systemHealth,
  selectedVideoName
}) => {
  const navItems = [
    { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library' as NavItem, label: 'Video Library', icon: Film },
    { id: 'upload' as NavItem, label: 'Upload Video', icon: UploadCloud },
    { id: 'analysis' as NavItem, label: 'Video Analysis', icon: Cpu, badge: selectedVideoName ? 'Active' : undefined },
    { id: 'timeline' as NavItem, label: 'Event Timeline', icon: Clock },
    { id: 'assistant' as NavItem, label: 'Video Assistant', icon: MessageSquare },
    { id: 'settings' as NavItem, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E1E5E9] flex flex-col h-screen shrink-0 select-none">
      {/* Brand Logo & Header */}
      <div className="p-5 border-b border-[#E1E5E9]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#2675B9] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            VX
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-[#20252B] tracking-tight text-base">VISIONX</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#E8F1F8] text-[#2675B9]">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-[#68717C] truncate font-medium">Video Intelligence System</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#68717C]/80">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#E8F1F8] text-[#2675B9] font-semibold'
                  : 'text-[#68717C] hover:bg-[#F5F6F7] hover:text-[#20252B]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#2675B9]' : 'text-[#68717C]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.2 bg-[#2675B9] text-white rounded font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Selected Video Context Banner if active */}
      {selectedVideoName && (
        <div className="px-3 py-2.5 mx-3 mb-2 bg-[#F5F6F7] border border-[#E1E5E9] rounded-md">
          <div className="flex items-center space-x-1.5 text-[11px] text-[#68717C] font-medium">
            <Film className="w-3.5 h-3.5 text-[#2675B9]" />
            <span>Target Footage</span>
          </div>
          <p className="text-xs font-semibold text-[#20252B] truncate mt-0.5" title={selectedVideoName}>
            {selectedVideoName}
          </p>
        </div>
      )}

      {/* Footer Info: User Profile & System Status */}
      <div className="p-4 border-t border-[#E1E5E9] bg-white text-xs text-[#68717C] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#E1E5E9] flex items-center justify-center text-[#20252B] font-semibold text-xs">
              OP
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-[#20252B] text-xs">Operator Console</p>
              <p className="text-[10px] text-[#68717C]">Station #4 • Security</p>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-[#39845A]" />
        </div>

        <div className="pt-2 border-t border-[#E1E5E9]/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5">
            <CircleDot
              className={`w-3 h-3 ${
                systemHealth?.geminiConnected ? 'text-[#39845A]' : 'text-[#D69A36]'
              }`}
            />
            <span className="font-medium text-[#20252B]">
              {systemHealth?.geminiConnected ? 'AI Connected' : 'Engine Ready'}
            </span>
          </div>
          <span className="text-[10px] text-[#68717C]">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
};
