import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react';
import { KnowledgeArticle, TicketCategory } from '../types';

interface KnowledgeBaseViewProps {
  articles: KnowledgeArticle[];
  highlightedArticleId?: string | null;
  onSelectArticleForDraft?: (article: KnowledgeArticle) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  articles,
  highlightedArticleId,
  onSelectArticleForDraft,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle>(
    articles.find((a) => a.id === highlightedArticleId) || articles[0]
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredArticles = articles.filter((art) => {
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-slate-50">
      {/* Left List of Articles */}
      <div className="w-full lg:w-96 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Enterprise Knowledge Base
              </h2>
              <p className="text-[11px] text-slate-500">
                Verified runbooks grounding AI draft generation
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search runbooks, SSO, billing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories ({articles.length})</option>
            <option value="Authentication & SSO">Authentication & SSO</option>
            <option value="Billing & Invoices">Billing & Invoices</option>
            <option value="IT Infrastructure">IT Infrastructure</option>
            <option value="Security & Access">Security & Access</option>
            <option value="Bug & Technical Issue">Bug & Technical Issue</option>
            <option value="Product & Feature Request">Product & Feature Request</option>
          </select>
        </div>

        {/* List of articles */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredArticles.map((art) => {
            const isSelected = activeArticle?.id === art.id;
            return (
              <div
                key={art.id}
                onClick={() => setActiveArticle(art)}
                className={`p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-[10px] font-bold text-slate-500">
                    {art.id}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700">
                    {art.category}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                  {art.title}
                </h3>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Used in {art.usageCount} AI drafts</span>
                  <span>Updated {art.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Detailed Article Viewer */}
      {activeArticle && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 bg-white">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Header info */}
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {activeArticle.id}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                  {activeArticle.category}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">
                  Referenced in {activeArticle.usageCount} automated resolutions
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {activeArticle.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong className="text-slate-900">Summary:</strong> {activeArticle.summary}
              </p>
            </div>

            {/* Content Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Standard Operating Procedure & Verification Steps:
                </h3>
                <button
                  onClick={() => handleCopyContent(activeArticle.content, activeArticle.id)}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedId === activeArticle.id ? 'Copied to clipboard!' : 'Copy Steps'}</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono text-slate-100 leading-relaxed whitespace-pre-wrap">
                {activeArticle.content}
              </div>
            </div>

            {/* Tags & RAG grounding metadata */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>AI Retrieval-Augmented Generation (RAG) Metadata</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This document is indexed in our vector store with semantic embeddings. When incoming tickets match keywords or vector cosine similarity scores (&gt;0.82), Gemini automatically injects these procedural instructions to draft high-accuracy replies.
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeArticle.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-mono text-slate-700 border border-slate-200"
                  >
                    <Tag className="h-2.5 w-2.5 text-indigo-500" />
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
