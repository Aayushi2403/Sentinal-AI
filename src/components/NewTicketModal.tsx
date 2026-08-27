import React, { useState } from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Frown,
  Meh,
  Plus,
  RefreshCw,
  Smile,
  Sparkles,
  TrendingDown,
  X,
  Zap,
} from 'lucide-react';
import { AIAnalysisResult } from '../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    customerName: string;
    customerEmail: string;
    company: string;
  }) => Promise<void>;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('Marcus Brody');
  const [customerEmail, setCustomerEmail] = useState('m.brody@global-retail.com');
  const [company, setCompany] = useState('Global Retail Group');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewAnalysis, setPreviewAnalysis] = useState<AIAnalysisResult | null>(null);

  if (!isOpen) return null;

  const handleLiveAnalyze = async () => {
    if (!title && !description) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/tickets/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          customerName,
          company,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setPreviewAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Failed to preview analyze:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        customerName,
        customerEmail,
        company,
      });
      setTitle('');
      setDescription('');
      setPreviewAnalysis(null);
      onClose();
    } catch (err) {
      console.error('Error submitting ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick template helpers for fast demo testing
  const applySampleScenario = (scenario: 'sso' | 'billing' | 'kubernetes' | 'mfa') => {
    if (scenario === 'sso') {
      setTitle('SAML 2.0 Auth callback returning HTTP 500 & clock drift error on Okta');
      setDescription('All our 120 marketing department users are unable to access the creative hub this morning. Okta returns "Clock drift exceeds limit". This is holding up our scheduled campaign launch today!');
      setCompany('Omni Media International');
      setCustomerName('Samantha Reed');
    } else if (scenario === 'billing') {
      setTitle('Charged 3 times for annual enterprise add-on invoice #INV-4920');
      setDescription('I am extremely disappointed. We approved one $1,200 transaction and our credit card shows 3 identical charges of $1,200 today! Please reverse the duplicate $2,400 immediately.');
      setCompany('Zenith Health Logistics');
      setCustomerName('Gregory House');
    } else if (scenario === 'kubernetes') {
      setTitle('PostgreSQL connection pool exhausted on analytics replica db-east-02');
      setDescription('Our BI metabase instance is throwing "FATAL: remaining connection slots are reserved for non-replication superuser connections". Active connections spiked to 250/250. Analytics dashboards are completely frozen for executive team.');
      setCompany('DataInsights AI');
      setCustomerName('Linus Vance');
    } else if (scenario === 'mfa') {
      setTitle('Emergency: Lead DevOps Engineer locked out of production console after phone reset');
      setDescription('Our on-call engineer lost access to the hardware TOTP token during phone upgrade. We have an urgent security patch to apply. Please issue emergency bypass code.');
      setCompany('FinTech Global Ltd');
      setCustomerName('Samira Khan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Submit Customer Ticket & Test AI Triage
              </h2>
              <p className="text-xs text-slate-500">
                Incoming tickets are automatically categorized, scored for sentiment, and drafted with AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick Demo Fillers */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Test Scenarios:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applySampleScenario('sso')}
                className="rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors"
              >
                🔐 SSO Login Outage
              </button>
              <button
                type="button"
                onClick={() => applySampleScenario('billing')}
                className="rounded-md bg-slate-100 hover:bg-rose-50 hover:text-rose-700 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors"
              >
                💳 Frustrated Duplicate Billing
              </button>
              <button
                type="button"
                onClick={() => applySampleScenario('kubernetes')}
                className="rounded-md bg-slate-100 hover:bg-amber-50 hover:text-amber-700 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors"
              >
                ⚡ DB Connection Exhaustion
              </button>
              <button
                type="button"
                onClick={() => applySampleScenario('mfa')}
                className="rounded-md bg-slate-100 hover:bg-purple-50 hover:text-purple-700 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors"
              >
                🛡️ MFA Reset Blocker
              </button>
            </div>
          </div>

          {/* Customer Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Customer Email
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Ticket Subject */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ticket Subject / Issue Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 403 Forbidden on Okta SAML callback or Duplicate $1,200 charge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Ticket Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Detailed Problem Description <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleLiveAnalyze}
                disabled={!title || !description || isAnalyzing}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-40"
              >
                <Sparkles className={`h-3 w-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>Test Live AI Triage</span>
              </button>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Describe the exact error codes, customer impact, urgency, and affected systems..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-xs leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Live AI Analysis Preview Box */}
          {previewAnalysis && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 space-y-2 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>Real-time AI Triage Prediction</span>
                </div>
                <span className="rounded bg-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                  {Math.round(previewAnalysis.categoryConfidence * 100)}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Category</div>
                  <div className="font-semibold text-slate-800 truncate">{previewAnalysis.category}</div>
                </div>
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Sentiment</div>
                  <div className="font-semibold text-slate-800 truncate capitalize">{previewAnalysis.sentiment} ({previewAnalysis.sentimentScore.toFixed(2)})</div>
                </div>
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Priority / SLA</div>
                  <div className="font-semibold text-slate-800 uppercase">{previewAnalysis.urgencyLevel}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-700 bg-white p-2 rounded border border-indigo-100">
                <span className="font-bold">AI Draft Solution:</span> {previewAnalysis.suggestedDraftReply.substring(0, 140)}...
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Triaging & Ingesting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Ingest & Auto-Triage Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
