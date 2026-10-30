import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { ChatMessage, VideoRecord, VideoAnalysis } from '../types';
import { parseTimestampToSeconds, formatTimestamp } from '../utils/videoUtils';

interface AssistantChatModuleProps {
  video: VideoRecord;
  analysis: VideoAnalysis | null;
  history: ChatMessage[];
  onSendMessage: (question: string) => Promise<void>;
  isLoading: boolean;
  onJumpToTimestamp: (seconds: number) => void;
}

export const AssistantChatModule: React.FC<AssistantChatModuleProps> = ({
  video,
  analysis,
  history,
  onSendMessage,
  isLoading,
  onJumpToTimestamp
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'When did the person start running?',
    'How many people entered the scene?',
    'What happened around 00:50?',
    'Did anyone drop an object?',
    'Describe what happened between 00:30 and 01:00.',
    'Was there any scene change?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;

    const q = inputQuestion.trim();
    setInputQuestion('');
    await onSendMessage(q);
  };

  const handleSuggestedClick = async (questionText: string) => {
    if (isLoading) return;
    await onSendMessage(questionText);
  };

  /**
   * Helper that parses assistant text and turns timestamps (e.g. 00:31 or 01:12)
   * into clickable interactive jump buttons!
   */
  const renderMessageTextWithClickableTimestamps = (text: string) => {
    // Regex matching timestamp patterns like 00:31, 01:15:30
    const regex = /(\b\d{1,2}:\d{2}(?::\d{2})?\b)/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (regex.test(part)) {
        const seconds = parseTimestampToSeconds(part);
        return (
          <button
            key={i}
            onClick={() => onJumpToTimestamp(seconds)}
            className="inline-flex items-center space-x-1 px-1.5 py-0.5 mx-1 rounded bg-[#20252B] hover:bg-[#2675B9] text-white font-mono text-xs font-semibold shadow-2xs transition-all cursor-pointer align-baseline"
            title={`Click to jump video to ${part}`}
          >
            <Clock className="w-3 h-3 text-[#E8F1F8]" />
            <span>{part}</span>
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-white rounded-lg border border-[#E1E5E9] p-5 flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E1E5E9]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-[#E8F1F8] text-[#2675B9]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#20252B]">Video Intelligence Assistant</h3>
            <p className="text-[11px] text-[#68717C]">
              Ask natural language questions grounded in "{video.fileName}"
            </p>
          </div>
        </div>

        <div className="text-[11px] px-2 py-0.5 rounded font-mono bg-[#F5F6F7] border border-[#E1E5E9] text-[#68717C]">
          {analysis ? 'Intelligence Active' : 'Awaiting Analysis'}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[440px] pr-1">
        {history.length === 0 ? (
          <div className="py-8 text-center text-[#68717C] text-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F1F8] text-[#2675B9] flex items-center justify-center mx-auto">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-[#20252B] text-sm">Interactive Video Assistant Ready</p>
              <p className="mt-1 text-[#68717C] max-w-sm mx-auto">
                Ask about events, people entering or leaving, dropped items, or specific time ranges. All timestamps in answers are clickable to jump video playback!
              </p>
            </div>
          </div>
        ) : (
          history.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded bg-[#2675B9] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#2675B9] text-white'
                    : 'bg-[#F5F6F7] text-[#20252B] border border-[#E1E5E9]'
                }`}
              >
                {msg.sender === 'user' ? (
                  <span>{msg.text}</span>
                ) : (
                  <div>{renderMessageTextWithClickableTimestamps(msg.text)}</div>
                )}
                <div
                  className={`text-[9px] mt-1 font-mono ${
                    msg.sender === 'user' ? 'text-white/80 text-right' : 'text-[#68717C]'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded bg-[#20252B] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center space-x-2.5 text-xs text-[#68717C] bg-[#F5F6F7] p-3 rounded-lg border border-[#E1E5E9] max-w-xs">
            <Loader2 className="w-4 h-4 animate-spin text-[#2675B9]" />
            <span>Analyzing footage and extracting timestamps...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div>
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[#68717C] mb-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#2675B9]" />
          <span>Suggested Inquiries</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestedClick(q)}
              disabled={isLoading || !analysis}
              className="text-[11px] px-2.5 py-1 rounded bg-[#F5F6F7] hover:bg-[#E8F1F8] hover:text-[#2675B9] text-[#20252B] border border-[#E1E5E9] transition-colors disabled:opacity-50 text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={
            analysis
              ? 'Ask a question about this video (e.g. When did the person start running?)...'
              : 'Please run AI analysis first to query video footage...'
          }
          disabled={isLoading || !analysis}
          className="w-full pl-3.5 pr-11 py-2.5 text-xs bg-[#F5F6F7] border border-[#E1E5E9] rounded-md text-[#20252B] focus:outline-none focus:border-[#2675B9] focus:bg-white transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isLoading || !analysis}
          className="absolute right-1.5 p-1.5 rounded bg-[#2675B9] hover:bg-[#1E6099] text-white disabled:opacity-40 transition-colors shadow-2xs"
          title="Send question"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </form>
    </div>
  );
};
