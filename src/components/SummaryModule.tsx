import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  RefreshCw,
  Users,
  Box,
  Eye,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { VideoAnalysis } from '../types';
import { formatTimestamp } from '../utils/videoUtils';

interface SummaryModuleProps {
  analysis: VideoAnalysis | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export const SummaryModule: React.FC<SummaryModuleProps> = ({
  analysis,
  onRegenerate,
  isRegenerating
}) => {
  const [copied, setCopied] = useState(false);

  if (!analysis) {
    return (
      <div className="bg-white rounded-lg border border-[#E1E5E9] p-6 text-center text-[#68717C]">
        <FileText className="w-8 h-8 text-[#A0A8B2] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#20252B]">No Video Summary Available</p>
        <p className="text-xs mt-1">Initiate AI analysis to extract summary and structured intelligence.</p>
      </div>
    );
  }

  const handleCopy = () => {
    const fullText = `VISIONX VIDEO INTELLIGENCE SUMMARY
Generated: ${new Date(analysis.createdAt).toLocaleString()}
Model: ${analysis.modelUsed}

OVERALL SUMMARY:
${analysis.summary}

MAIN ACTIVITIES:
${analysis.mainActivities.map(a => `• ${a}`).join('\n')}

KEY OBSERVATIONS:
${analysis.keyObservations.map(k => `• ${k}`).join('\n')}

PEOPLE DETECTED:
${analysis.people.map(p => `• ${p.id}: ${p.description} (Active: ${formatTimestamp(p.firstSeen)} - ${formatTimestamp(p.lastSeen)})`).join('\n')}

OBJECTS DETECTED:
${analysis.objects.map(o => `• ${o.name}: Active ${formatTimestamp(o.firstSeen)} - ${formatTimestamp(o.lastSeen)} (${o.interaction || 'Observed'})`).join('\n')}
`;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-lg border border-[#E1E5E9] p-5 space-y-5">
      {/* Header with actions */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E1E5E9]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-[#E8F1F8] text-[#2675B9]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#20252B]">Executive Video Summary</h3>
            <p className="text-[11px] text-[#68717C]">
              Engine: <span className="font-mono text-[#20252B] font-medium">{analysis.modelUsed}</span> • Duration: {Math.round(analysis.analysisDurationMs / 1000)}s
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium border border-[#E1E5E9] hover:bg-[#F5F6F7] text-[#20252B] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#39845A]" />
                <span className="text-[#39845A]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#68717C]" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium bg-[#E8F1F8] text-[#2675B9] hover:bg-[#2675B9] hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Narrative Summary */}
      <div className="bg-[#F5F6F7] p-3.5 rounded-md border border-[#E1E5E9]/80">
        <h4 className="text-xs font-semibold text-[#68717C] uppercase tracking-wider mb-1.5">
          Overview Narrative
        </h4>
        <p className="text-xs text-[#20252B] leading-relaxed font-normal">
          {analysis.summary}
        </p>
      </div>

      {/* Key Activities & Observations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Main Activities */}
        <div className="border border-[#E1E5E9] rounded-md p-3.5">
          <div className="flex items-center space-x-1.5 mb-2.5 text-xs font-bold text-[#20252B]">
            <Activity className="w-3.5 h-3.5 text-[#2675B9]" />
            <span>Identified Activities</span>
          </div>
          <ul className="space-y-1.5 text-xs text-[#20252B]">
            {analysis.mainActivities.map((act, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2675B9] mt-1.5 shrink-0" />
                <span className="leading-tight">{act}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Observations */}
        <div className="border border-[#E1E5E9] rounded-md p-3.5">
          <div className="flex items-center space-x-1.5 mb-2.5 text-xs font-bold text-[#20252B]">
            <Eye className="w-3.5 h-3.5 text-[#2675B9]" />
            <span>Key Observations</span>
          </div>
          <ul className="space-y-1.5 text-xs text-[#20252B]">
            {analysis.keyObservations.map((obs, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39845A] mt-1.5 shrink-0" />
                <span className="leading-tight">{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* People & Objects Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E1E5E9]">
        {/* People */}
        <div>
          <div className="flex items-center space-x-1.5 mb-2 text-xs font-bold text-[#20252B]">
            <Users className="w-3.5 h-3.5 text-[#2675B9]" />
            <span>Observed People ({analysis.people.length})</span>
          </div>
          <div className="space-y-2">
            {analysis.people.map((p) => (
              <div key={p.id} className="bg-[#F5F6F7] p-2.5 rounded border border-[#E1E5E9] text-xs">
                <div className="flex items-center justify-between font-semibold text-[#20252B]">
                  <span>{p.id}</span>
                  <span className="font-mono text-[10px] text-[#68717C]">
                    {formatTimestamp(p.firstSeen)} – {formatTimestamp(p.lastSeen)}
                  </span>
                </div>
                <p className="text-[11px] text-[#68717C] mt-0.5">{p.description}</p>
                {p.clothing && (
                  <p className="text-[10px] text-[#20252B] mt-1">
                    <span className="text-[#68717C]">Attire: </span>{p.clothing}
                  </p>
                )}
                {p.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.actions.map((act, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-white border border-[#E1E5E9] text-[10px] rounded text-[#20252B]">
                        {act}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Objects */}
        <div>
          <div className="flex items-center space-x-1.5 mb-2 text-xs font-bold text-[#20252B]">
            <Box className="w-3.5 h-3.5 text-[#2675B9]" />
            <span>Notable Objects ({analysis.objects.length})</span>
          </div>
          <div className="space-y-2">
            {analysis.objects.map((obj, i) => (
              <div key={i} className="bg-[#F5F6F7] p-2.5 rounded border border-[#E1E5E9] text-xs">
                <div className="flex items-center justify-between font-semibold text-[#20252B]">
                  <span>{obj.name}</span>
                  <span className="font-mono text-[10px] text-[#68717C]">
                    {formatTimestamp(obj.firstSeen)} – {formatTimestamp(obj.lastSeen)}
                  </span>
                </div>
                {obj.interaction && (
                  <p className="text-[11px] text-[#68717C] mt-0.5">{obj.interaction}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
