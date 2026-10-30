import React, { useState } from 'react';
import { X, Edit3 } from 'lucide-react';
import { VideoRecord } from '../types';

interface RenameModalProps {
  video: VideoRecord;
  isOpen: boolean;
  onClose: () => void;
  onRename: (videoId: string, newName: string) => Promise<void>;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  video,
  isOpen,
  onClose,
  onRename
}) => {
  const [name, setName] = useState(video.fileName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Video name cannot be empty');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onRename(video.id, name.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename video');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-[#E1E5E9] max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E1E5E9]">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-[#2675B9]" />
            <h3 className="text-sm font-bold text-[#20252B]">Rename Video Record</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#68717C] hover:bg-[#F5F6F7] hover:text-[#20252B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-[#C94B45]/10 border border-[#C94B45]/30 rounded text-xs text-[#C94B45]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#20252B] mb-1">
              File Name / Surveillance Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F5F6F7] border border-[#E1E5E9] rounded focus:outline-none focus:border-[#2675B9] focus:bg-white text-[#20252B]"
              placeholder="e.g. CCTV_Front_Corridor_CAM01.mp4"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[#E1E5E9] text-xs font-medium text-[#68717C] hover:bg-[#F5F6F7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 rounded bg-[#2675B9] hover:bg-[#1E6099] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Update Name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
