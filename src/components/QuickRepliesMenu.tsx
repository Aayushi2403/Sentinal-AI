import React, { useState, useEffect, useRef } from 'react';
import { QuickReply } from '../types';
import { Settings, MessageSquarePlus, ChevronDown, Edit2, Trash2, Plus, X } from 'lucide-react';

interface QuickRepliesMenuProps {
  onSelect: (content: string) => void;
}

export const QuickRepliesMenu: React.FC<QuickRepliesMenuProps> = ({ onSelect }) => {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<Partial<QuickReply> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReplies();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReplies = async () => {
    try {
      const res = await fetch('/api/quick-replies');
      const data = await res.json();
      if (data.success) {
        setReplies(data.quickReplies);
      }
    } catch (err) {
      console.error('Failed to fetch quick replies', err);
    }
  };

  const handleSave = async () => {
    if (!editingReply?.title || !editingReply?.content) return;
    
    try {
      if (editingReply.id) {
        await fetch(`/api/quick-replies/${editingReply.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingReply),
        });
      } else {
        await fetch('/api/quick-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingReply),
        });
      }
      await fetchReplies();
      setEditingReply(null);
    } catch (err) {
      console.error('Failed to save quick reply', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await fetch(`/api/quick-replies/${id}`, { method: 'DELETE' });
      await fetchReplies();
    } catch (err) {
      console.error('Failed to delete quick reply', err);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Dropdown Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-2xs transition-colors"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-500" />
        Quick Replies
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-[280px] max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden flex flex-col max-h-[60vh] sm:max-h-80">
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Canned Responses</span>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsManageModalOpen(true);
              }}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
              title="Manage Templates"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 p-1">
            {replies.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500 italic">No templates available.</div>
            ) : (
              replies.map((qr) => (
                <button
                  key={qr.id}
                  onClick={() => {
                    onSelect(qr.content);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md transition-colors group flex flex-col gap-0.5"
                >
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700">{qr.title}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-2">{qr.content}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Manage Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col h-[90vh] sm:max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Manage Quick Replies</h3>
              </div>
              <button 
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* List */}
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col bg-slate-50/50 h-1/2 md:h-full shrink-0 md:shrink">
                <div className="p-3 border-b border-slate-100 shrink-0">
                  <button
                    onClick={() => setEditingReply({ title: '', content: '' })}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Template
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {replies.map(qr => (
                    <div 
                      key={qr.id} 
                      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        editingReply?.id === qr.id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-200 text-slate-700'
                      }`}
                      onClick={() => setEditingReply(qr)}
                    >
                      <span className="text-xs font-semibold truncate pr-2">{qr.title}</span>
                      <div className={`flex items-center gap-1 shrink-0 ${editingReply?.id === qr.id ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'}`}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(qr.id); }}
                          className={`p-1.5 sm:p-1 rounded hover:bg-red-500/20 hover:text-red-300 transition-colors ${
                            editingReply?.id === qr.id ? 'text-indigo-200' : 'text-slate-400 hover:text-red-500'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editor */}
              <div className="w-full md:w-2/3 flex flex-col p-4 sm:p-6 bg-white flex-1 overflow-y-auto">
                {editingReply ? (
                  <div className="flex-1 flex flex-col gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Template Title</label>
                      <input
                        type="text"
                        value={editingReply.title || ''}
                        onChange={(e) => setEditingReply({ ...editingReply, title: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Greeting & Acknowledgment"
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-h-[150px]">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Template Content</label>
                      <textarea
                        value={editingReply.content || ''}
                        onChange={(e) => setEditingReply({ ...editingReply, content: e.target.value })}
                        className="w-full flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
                        placeholder="Type your canned response here..."
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 shrink-0">
                      <button
                        onClick={() => setEditingReply(null)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!editingReply.title || !editingReply.content}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                      >
                        Save Template
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
                    <MessageSquarePlus className="w-12 h-12 mb-3 text-slate-200" />
                    <p className="text-sm font-medium">Select a template to edit</p>
                    <p className="text-xs mt-1">or create a new one to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
