import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { ArchitectureSpecView } from './components/ArchitectureSpecView';
import { NewTicketModal } from './components/NewTicketModal';
import { BatchSimulatorModal } from './components/BatchSimulatorModal';
import { AgentInfo, HelpdeskMetrics, KnowledgeArticle, Ticket } from './types';
import { ENTERPRISE_KNOWLEDGE_BASE } from '../server/knowledgeBase';
import { CheckCircle2, MessageSquare, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'analytics' | 'knowledge' | 'architecture'>('workspace');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeArticle[]>(ENTERPRISE_KNOWLEDGE_BASE);
  const [metrics, setMetrics] = useState<HelpdeskMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isBatchSimModalOpen, setIsBatchSimModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [highlightedKbId, setHighlightedKbId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedSentiment !== 'all') params.append('sentiment', selectedSentiment);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
        if (!selectedTicketId && data.tickets.length > 0) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  const fetchAgentsAndKb = async () => {
    try {
      const [agentsRes, kbRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/knowledge-base'),
      ]);
      const agentsData = await agentsRes.json();
      const kbData = await kbRes.json();
      if (agentsData.success) setAgents(agentsData.agents);
      if (kbData.success) setKnowledgeBase(kbData.articles);
    } catch (err) {
      console.error('Error fetching meta:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchTickets(), fetchMetrics(), fetchAgentsAndKb()]);
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [selectedCategory, selectedStatus, selectedSentiment, searchQuery]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
  const urgentCount = tickets.filter((t) => t.priority === 'urgent' && t.status !== 'resolved').length;

  const handleCreateTicket = async (payload: {
    title: string;
    description: string;
    customerName: string;
    customerEmail: string;
    company: string;
  }) => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success && data.ticket) {
      setTickets((prev) => [data.ticket, ...prev]);
      setSelectedTicketId(data.ticket.id);
      fetchMetrics();
      showToast(`Ticket ${data.ticket.ticketNumber} triaged & categorized as "${data.ticket.category}"!`);
    }
  };

  const handleUpdateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) => prev.map((t) => (t.id === id ? data.ticket : t)));
        fetchMetrics();
        if (updates.status === 'resolved') {
          showToast(`Ticket ${data.ticket.ticketNumber} marked as Resolved.`);
        }
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  const handleSendMessage = async (
    ticketId: string,
    content: string,
    isAiDraft: boolean = false,
    confidence?: number
  ) => {
    try {
      const activeAgent = agents[0] || { name: 'Marcus Aurelius' };
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'agent',
          senderName: activeAgent.name,
          content,
          isAiDraft,
          confidence,
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? data.ticket : t)));
        fetchMetrics();
        showToast('Reply dispatched to customer.');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  const handleBatchProcessed = () => {
    fetchTickets();
    fetchMetrics();
    showToast('Asynchronous batch ingested & triaged successfully!');
  };

  const handleViewKbArticle = (titleOrId: string) => {
    const matched = knowledgeBase.find(
      (k) => k.id === titleOrId || k.title.toLowerCase().includes(titleOrId.toLowerCase())
    );
    if (matched) {
      setHighlightedKbId(matched.id);
      setActiveTab('knowledge');
    }
  };

  return (
    <div className="flex min-h-dvh lg:h-dvh w-full bg-[#F1F5F9] font-sans lg:overflow-hidden text-slate-800 antialiased select-none">
      {/* Desktop Navy Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
          }}
          urgentCount={urgentCount}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="w-64 h-full relative">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsMobileMenuOpen(false);
              }}
              urgentCount={urgentCount}
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-[-40px] text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden bg-[#F1F5F9]">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          urgentCount={urgentCount}
          activeAgent={agents[0] || null}
          onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
          onOpenBatchSim={() => setIsBatchSimModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Content View Container */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 lg:overflow-hidden flex flex-col">
          {activeTab === 'workspace' && (
            <div className="flex flex-1 gap-4 sm:gap-6 lg:overflow-hidden lg:h-full flex-col lg:flex-row relative">
              {/* Left Column: Ticket Queue */}
              <div className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 lg:h-full flex-col ${selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
                <TicketList
                  tickets={tickets}
                  selectedTicketId={selectedTicketId}
                  onSelectTicket={(t) => setSelectedTicketId(t.id)}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedSentiment={selectedSentiment}
                  setSelectedSentiment={setSelectedSentiment}
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                />
              </div>

              {/* Right Column: Ticket Detail & AI Copilot */}
              <div className={`flex-1 lg:h-full flex-col min-w-0 lg:overflow-hidden ${selectedTicketId ? 'flex' : 'hidden lg:flex'}`}>
                {selectedTicket ? (
                  <TicketDetail
                    ticket={selectedTicket}
                    agents={agents}
                    onUpdateTicket={handleUpdateTicket}
                    onSendMessage={handleSendMessage}
                    onViewKbArticle={handleViewKbArticle}
                    onBack={() => setSelectedTicketId(null)}
                  />
                ) : (
                  <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <div className="max-w-sm">
                      <MessageSquare className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No ticket selected</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Select a ticket from the left queue or click "+ New Ticket" to create one.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && metrics && (
            <div className="flex-1 lg:overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <AnalyticsDashboard metrics={metrics} agents={agents} tickets={tickets} />
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="flex-1 lg:overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <KnowledgeBaseView
                articles={knowledgeBase}
                highlightedArticleId={highlightedKbId}
              />
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="flex-1 lg:overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <ArchitectureSpecView />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        onSubmit={handleCreateTicket}
      />

      <BatchSimulatorModal
        isOpen={isBatchSimModalOpen}
        onClose={() => setIsBatchSimModalOpen(false)}
        onBatchProcessed={handleBatchProcessed}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-3 duration-200 border border-slate-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
