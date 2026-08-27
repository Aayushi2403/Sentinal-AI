import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SlidersHorizontal,
  Wrench,
  HelpCircle,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  FileText,
  ExternalLink,
  ArrowRight,
  Send,
  Zap,
} from 'lucide-react';
import { ResponseTone, SmartResponseTemplate, SmartTemplateCategory, Ticket } from '../types';

interface SmartResponseSuggestionsProps {
  ticket: Ticket;
  onApplyTemplate: (content: string, groundedSources?: string[]) => void;
  onViewKbArticle?: (titleOrId: string) => void;
}

export const SmartResponseSuggestions: React.FC<SmartResponseSuggestionsProps> = ({
  ticket,
  onApplyTemplate,
  onViewKbArticle,
}) => {
  const [templates, setTemplates] = useState<SmartResponseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SmartTemplateCategory | 'all'>('all');
  const [selectedTone, setSelectedTone] = useState<ResponseTone>('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showCustomDrawer, setShowCustomDrawer] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  // Fetch or generate templates on ticket change or tone change
  const fetchSmartTemplates = async (tone: ResponseTone = selectedTone, instructions?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/smart-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone,
          customInstructions: instructions !== undefined ? instructions : customInstructions,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error('Failed to fetch smart templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartTemplates(selectedTone);
  }, [ticket.id, ticket.updatedAt]);

  const handleToneChange = (newTone: ResponseTone) => {
    setSelectedTone(newTone);
    fetchSmartTemplates(newTone);
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (tpl: SmartResponseTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    onApplyTemplate(tpl.fullContent, tpl.groundedKnowledgeArticles);
    setAppliedId(tpl.id);
    setTimeout(() => setAppliedId(null), 2000);
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.templateType === selectedCategory);

  const getCategoryIcon = (type: SmartTemplateCategory) => {
    switch (type) {
      case 'fix_protocol':
        return <Wrench className="h-3.5 w-3.5" />;
      case 'diagnostic':
        return <HelpCircle className="h-3.5 w-3.5" />;
      case 'escalation':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'empathy':
        return <HeartHandshake className="h-3.5 w-3.5" />;
      case 'closure':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryStyles = (type: SmartTemplateCategory) => {
    switch (type) {
      case 'fix_protocol':
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          border: 'border-emerald-200 hover:border-emerald-300',
          indicator: 'bg-emerald-500',
        };
      case 'diagnostic':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          border: 'border-amber-200 hover:border-amber-300',
          indicator: 'bg-amber-500',
        };
      case 'escalation':
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          border: 'border-rose-200 hover:border-rose-300',
          indicator: 'bg-rose-500',
        };
      case 'empathy':
        return {
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          border: 'border-indigo-200 hover:border-indigo-300',
          indicator: 'bg-indigo-500',
        };
      case 'closure':
        return {
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          border: 'border-blue-200 hover:border-blue-300',
          indicator: 'bg-blue-500',
        };
      default:
        return {
          badge: 'bg-slate-50 text-slate-700 border-slate-200',
          border: 'border-slate-200 hover:border-slate-300',
          indicator: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5 shrink-0">
      {/* Header with Title and Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                Smart Response Suggestions
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-800 border border-indigo-200/60">
                <Zap className="h-2.5 w-2.5" />
                Context-Aware AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Grounded on ticket history, customer sentiment, and verified knowledge base runbooks
            </p>
          </div>
        </div>

        {/* Right side controls: Tone & Refresh & Custom Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tone Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs text-[11px]">
            {(
              [
                { id: 'professional', label: 'Professional' },
                { id: 'empathetic', label: 'Empathetic' },
                { id: 'technical', label: 'Technical' },
                { id: 'concise', label: 'Concise' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => handleToneChange(t.id)}
                disabled={isLoading}
                className={`px-2.5 py-1 font-medium rounded-md transition-all ${
                  selectedTone === t.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Custom prompt toggle button */}
          <button
            onClick={() => setShowCustomDrawer(!showCustomDrawer)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all ${
              showCustomDrawer
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Custom instructions for AI generation"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Refine</span>
          </button>

          {/* Regenerate Button */}
          <button
            onClick={() => fetchSmartTemplates(selectedTone)}
            disabled={isLoading}
            className="p-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center gap-1 shadow-2xs transition-all disabled:opacity-50"
            title="Regenerate suggestions with AI"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>
      </div>

      {/* Refine / Custom Instructions Drawer */}
      {showCustomDrawer && (
        <div className="p-3 bg-white border border-indigo-100 rounded-xl shadow-2xs flex flex-col gap-2 animate-in fade-in duration-200">
          <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>Guide AI Generation with Specific Agent Context:</span>
            <span className="text-[10px] text-slate-400">e.g. Mention next release or ask for traceroute</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSmartTemplates(selectedTone, customInstructions)}
              placeholder="e.g., Include request for HAR network archive file, or note scheduled server maintenance..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => fetchSmartTemplates(selectedTone, customInstructions)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
            >
              Apply Prompt
            </button>
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          Filter:
        </span>
        {[
          { id: 'all', label: 'All Suggestions', count: templates.length },
          { id: 'fix_protocol', label: 'Verified Fix', count: templates.filter((t) => t.templateType === 'fix_protocol').length },
          { id: 'diagnostic', label: 'Diagnostic', count: templates.filter((t) => t.templateType === 'diagnostic').length },
          { id: 'escalation', label: 'Escalation / SLA', count: templates.filter((t) => t.templateType === 'escalation').length },
          { id: 'empathy', label: 'Empathetic', count: templates.filter((t) => t.templateType === 'empathy').length },
          { id: 'closure', label: 'Closure', count: templates.filter((t) => t.templateType === 'closure').length },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id as any)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedCategory === c.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <span>{c.label}</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === c.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {/* Suggestion Cards Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {isLoading && templates.length === 0 ? (
          <div className="col-span-full py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
            <p className="text-xs font-medium text-slate-600">
              Generating contextual response templates with Gemini...
            </p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
            No templates in this category. Select another filter above.
          </div>
        ) : (
          filteredTemplates.map((tpl) => {
            const styles = getCategoryStyles(tpl.templateType);
            const isExpanded = expandedTemplateId === tpl.id;
            const isCopied = copiedId === tpl.id;
            const isApplied = appliedId === tpl.id;

            return (
              <div
                key={tpl.id}
                className={`bg-white border rounded-xl p-3.5 shadow-2xs transition-all flex flex-col justify-between gap-2.5 group ${styles.border}`}
              >
                {/* Card Top: Category Badge + Confidence + Action Icons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${styles.badge}`}
                    >
                      {getCategoryIcon(tpl.templateType)}
                      {tpl.badgeLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {Math.round(tpl.confidence * 100)}% Match
                    </span>
                  </div>

                  {/* Header quick actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleCopy(tpl.id, tpl.fullContent, e)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      title="Copy template to clipboard"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      title={isExpanded ? 'Collapse template' : 'Expand full template'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Title & Context Reason */}
                <div>
                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-indigo-950 transition-colors line-clamp-1">
                    {tpl.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {tpl.description}
                  </p>
                </div>

                {/* Template Content Box (Preview or Full) */}
                <div
                  className={`bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-line ${
                    isExpanded ? 'max-h-80 overflow-y-auto' : 'max-h-24 line-clamp-3 overflow-hidden'
                  }`}
                >
                  {tpl.fullContent}
                </div>

                {/* Grounded Knowledge Base reference */}
                {tpl.groundedKnowledgeArticles && tpl.groundedKnowledgeArticles.length > 0 && (
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                    <div className="flex items-center gap-1 truncate mr-2">
                      <BookOpen className="h-3 w-3 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-slate-600 shrink-0">KB:</span>
                      <button
                        onClick={() => onViewKbArticle?.(tpl.groundedKnowledgeArticles[0])}
                        className="truncate underline text-indigo-700 hover:text-indigo-900 font-medium text-left"
                      >
                        {tpl.groundedKnowledgeArticles[0]}
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Action: Use in Editor */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 italic truncate max-w-[140px]">
                    {tpl.contextReason}
                  </span>

                  <button
                    onClick={(e) => handleApply(tpl, e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-98 flex items-center gap-1.5 shadow-2xs ${
                      isApplied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Applied!</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3" />
                        <span>Use in Editor</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
