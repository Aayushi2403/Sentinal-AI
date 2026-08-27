import React, { useState } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { Ticket } from '../types';

interface BatchSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchProcessed: () => void;
}

export const BatchSimulatorModal: React.FC<BatchSimulatorModalProps> = ({
  isOpen,
  onClose,
  onBatchProcessed,
}) => {
  const [batchSize, setBatchSize] = useState<number>(3);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [resultTickets, setResultTickets] = useState<Ticket[]>([]);

  if (!isOpen) return null;

  const runSimulation = async () => {
    setIsRunning(true);
    setProgress(15);
    setSimulatedLogs([
      `[0.00s] Initializing Celery/FastAPI asynchronous worker pool...`,
      `[0.05s] Fetching ${batchSize} incoming enterprise webhook payloads...`,
    ]);
    setResultTickets([]);

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProgress(45);
      setSimulatedLogs((prev) => [
        ...prev,
        `[0.65s] Dispatching to LangChain Triage Chain with Gemini 3.7 Flash...`,
        `[0.85s] Running Sentiment Vector Scoring & Knowledge Base RAG matching...`,
      ]);

      const res = await fetch('/api/tickets/batch-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize }),
      });
      const data = await res.json();

      setProgress(85);
      await new Promise((r) => setTimeout(r, 400));
      setProgress(100);

      if (data.success) {
        setResultTickets(data.tickets || []);
        setSimulatedLogs((prev) => [
          ...prev,
          `[1.25s] Ingested & auto-categorized ${data.tickets.length} tickets successfully (92.4% avg accuracy).`,
          `[1.30s] SLA timers and automated drafts attached to tickets.`,
        ]);
        onBatchProcessed();
      }
    } catch (err) {
      console.error('Batch simulation error:', err);
      setSimulatedLogs((prev) => [...prev, `[ERROR] Batch processing failed: ${err}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xs">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Asynchronous Ticket Ingestion Queue Simulator
              </h2>
              <p className="text-xs text-slate-500">
                Demonstrates high-throughput asynchronous request handling & auto-tagging
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* SDE Pipeline Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>FastAPI / Celery Asynchronous Triage Workflow</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              When tickets arrive in bursts, the ingestion pipeline accepts webhooks with HTTP 202 Accepted, pushes payloads onto a Redis task queue, and distributes them across worker threads running LangChain structured triage chains for categorization, sentiment assessment, and draft generation.
            </p>
          </div>

          {/* Control Bar */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-0.5">
                Batch Ingestion Volume:
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBatchSize(size)}
                    disabled={isRunning}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      batchSize === size
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {size} {size === 1 ? 'Ticket' : 'Tickets'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing Async Queue...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Trigger Batch Pipeline</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {isRunning || progress > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Queue Processing Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {/* Logs Terminal */}
          {simulatedLogs.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-[11px] font-mono text-emerald-400 space-y-1 max-h-40 overflow-y-auto">
              <div className="text-slate-400 border-b border-slate-800 pb-1 mb-1 font-sans text-xs">
                Worker Task Stream Output:
              </div>
              {simulatedLogs.map((log, i) => (
                <div key={i} className="leading-tight">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Generated Result Cards */}
          {resultTickets.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Triaged Tickets in Batch ({resultTickets.length}):
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {resultTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="font-mono text-indigo-700">{t.ticketNumber}</span>
                        <span>{t.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Category: <strong className="text-slate-800">{t.category}</strong> · Sentiment: <strong className="text-slate-800 capitalize">{t.sentiment} ({t.sentimentScore.toFixed(2)})</strong> · Priority: <strong className="text-slate-800 uppercase">{t.priority}</strong>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {Math.round(t.aiAnalysis.categoryConfidence * 100)}% Acc
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-3.5 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 transition-colors"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
