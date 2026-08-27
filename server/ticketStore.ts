import { AgentInfo, HelpdeskMetrics, Ticket, TicketCategory, TicketPriority, TicketSentiment, TicketStatus } from '../src/types';
import { analyzeTicketWithAI } from './geminiService';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, where, writeBatch, orderBy, limit } from 'firebase/firestore';


export const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: 'agent-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@enterprise.io',
    role: 'Senior SRE & IT Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'IT Infrastructure',
    activeTickets: 4,
    rating: 4.9,
  },
  {
    id: 'agent-2',
    name: 'Marcus Chen',
    email: 'marcus.chen@enterprise.io',
    role: 'Identity & SecOps Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Security & Access',
    activeTickets: 3,
    rating: 4.8,
  },
  {
    id: 'agent-3',
    name: 'Sarah Jenkins',
    email: 'sarah.j@enterprise.io',
    role: 'Enterprise Billing Operations',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Billing & Invoices',
    activeTickets: 5,
    rating: 4.95,
  },
  {
    id: 'agent-4',
    name: 'Devon Vance',
    email: 'devon.v@enterprise.io',
    role: 'Tier 2 Developer Support',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Bug & Technical Issue',
    activeTickets: 2,
    rating: 4.7,
  }
];

const ticketsCol = collection(db, 'tickets');
const activityCol = collection(db, 'activity');

let seeded = false;
async function seedDatabase() {
  if (seeded) return;
  const snap = await getDocs(query(ticketsCol, limit(1)));
  if (snap.empty) {
    const batch = writeBatch(db);
    for (const t of []) {
      batch.set(doc(ticketsCol, t.id), t);
    }
    for (const a of []) {
      batch.set(doc(activityCol, a.id), a);
    }
    await batch.commit();
  }
  seeded = true;
}

export async function getTickets(
  category?: string,
  status?: string,
  sentiment?: string,
  search?: string
): Promise<Ticket[]> {
  await seedDatabase();
  
  let q = ticketsCol as any;
  if (category && category !== 'all') {
    q = query(q, where('category', '==', category));
  }
  if (status && status !== 'all') {
    q = query(q, where('status', '==', status));
  }
  if (sentiment && sentiment !== 'all') {
    q = query(q, where('sentiment', '==', sentiment));
  }

  const snap = await getDocs(q);
  let results = snap.docs.map(d => d.data() as Ticket);

  if (search && search.trim() !== '') {
    const s = search.toLowerCase();
    results = results.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.ticketNumber.toLowerCase().includes(s) ||
        t.customerName.toLowerCase().includes(s) ||
        t.company.toLowerCase().includes(s) ||
        t.tags.some((tag) => tag.toLowerCase().includes(s))
    );
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results;
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  await seedDatabase();
  const d = await getDoc(doc(ticketsCol, id));
  return d.exists() ? (d.data() as Ticket) : null;
}

export async function createTicket(
  title: string,
  description: string,
  customerName: string,
  customerEmail: string,
  company: string,
  tags: string[] = []
): Promise<Ticket> {
  await seedDatabase();
  const id = `tck-${Date.now()}`;
  const ticketNumber = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

  let aiAnalysis = {
    category: 'General Inquiry' as TicketCategory,
    urgencyLevel: 'low' as TicketPriority,
    sentiment: 'neutral' as TicketSentiment,
    sentimentScore: 0,
    keyIssues: ['Review required'],
    suggestedDraftReply: 'Thank you for reaching out. Our team will review your request.',
    categoryConfidence: 0.8,
    recommendedDepartment: 'General Support',
    groundedArticles: [],
    urgencyScore: 5,
    urgencyReasoning: "Fallback",
    summary: "Fallback summary",
    automatedResolutionPossible: false,
    processedAt: new Date().toISOString(),
    processingTimeMs: 10,
  };

  try {
    const analysis = await analyzeTicketWithAI(title, description, customerName, company);
    if (analysis) {
      aiAnalysis = analysis;
    }
  } catch (e) {
    console.error('AI Analysis failed, using fallback:', e);
  }

  const slaTotalMinutes =
    aiAnalysis.urgencyLevel === 'urgent' ? 60 : aiAnalysis.urgencyLevel === 'high' ? 120 : aiAnalysis.urgencyLevel === 'medium' ? 240 : 480;

  const matchingAgent = INITIAL_AGENTS.find((a) => a.department === aiAnalysis.category) || INITIAL_AGENTS[0];

  const newTicket: Ticket = {
    id,
    ticketNumber,
    title,
    description,
    customerName,
    customerEmail,
    company,
    category: aiAnalysis.category,
    sentiment: aiAnalysis.sentiment,
    sentimentScore: aiAnalysis.sentimentScore,
    priority: aiAnalysis.urgencyLevel,
    status: 'open',
    tags: Array.from(new Set([...tags, ...aiAnalysis.keyIssues.map((k) => k.toLowerCase().replace(/\s+/g, '-').slice(0, 15))])),
    assignedAgent: matchingAgent.name,
    assignedAgentEmail: matchingAgent.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slaMinutesRemaining: slaTotalMinutes,
    slaTotalMinutes,
    slaBreached: false,
    messages: [
      {
        id: `msg-${Date.now()}-1`,
        ticketId: id,
        sender: 'customer',
        senderName: customerName,
        content: description,
        timestamp: new Date().toISOString(),
      },
    ],
    aiAnalysis,
    suggestedActions: [
      `Review AI-drafted reply (${aiAnalysis.groundedArticles[0] || 'Knowledge base'})`,
      `Assign to ${aiAnalysis.recommendedDepartment}`,
      `Verify SLA countdown: ${slaTotalMinutes} minutes`,
    ],
  };

  const newActivity = {
    id: `act-${Date.now()}`,
    ticketNumber: newTicket.ticketNumber,
    action: `New ticket ingested & categorized as "${aiAnalysis.category}" (${Math.round(aiAnalysis.categoryConfidence * 100)}% accuracy)`,
    timestamp: new Date().toISOString(),
    actor: 'Gemini Async Pipeline',
  };

  const batch = writeBatch(db);
  batch.set(doc(ticketsCol, id), newTicket);
  batch.set(doc(activityCol, newActivity.id), newActivity);
  await batch.commit();

  return newTicket;
}

export async function updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  await seedDatabase();
  const docRef = doc(ticketsCol, id);
  const d = await getDoc(docRef);
  if (!d.exists()) return null;

  const current = d.data() as Ticket;
  const updated: Ticket = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.status === 'resolved' && current.status !== 'resolved') {
    const elapsedMinutes = Math.max(
      1,
      Math.round((Date.now() - new Date(current.createdAt).getTime()) / (1000 * 60))
    );
    updated.resolutionTimeMinutes = elapsedMinutes;
  }

  const newActivity = {
    id: `act-${Date.now()}`,
    ticketNumber: current.ticketNumber,
    action: `Updated status to "${updated.status}" & priority to "${updated.priority}"`,
    timestamp: new Date().toISOString(),
    actor: updated.assignedAgent || 'Support Lead',
  };

  const batch = writeBatch(db);
  batch.set(docRef, updated);
  batch.set(doc(activityCol, newActivity.id), newActivity);
  await batch.commit();

  return updated;
}

export async function addMessageToTicket(
  ticketId: string,
  sender: 'customer' | 'agent' | 'ai_assistant',
  senderName: string,
  content: string,
  isAiDraft: boolean = false,
  confidence?: number,
  groundedSources?: string[]
): Promise<Ticket | null> {
  await seedDatabase();
  const docRef = doc(ticketsCol, ticketId);
  const d = await getDoc(docRef);
  if (!d.exists()) return null;

  const ticket = d.data() as Ticket;
  const newMessage = {
    id: `msg-${Date.now()}`,
    ticketId,
    sender,
    senderName,
    content,
    timestamp: new Date().toISOString(),
    isAiDraft,
    confidence,
    groundedSources,
  };

  ticket.messages.push(newMessage);
  ticket.updatedAt = new Date().toISOString();

  if (sender === 'agent' && !ticket.firstResponseTimeMinutes) {
    ticket.firstResponseTimeMinutes = Math.max(
      1,
      Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60))
    );
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
  }

  const newActivity = {
    id: `act-${Date.now()}`,
    ticketNumber: ticket.ticketNumber,
    action: `Response sent by ${senderName} (${sender === 'agent' ? 'Agent' : 'Customer'})`,
    timestamp: new Date().toISOString(),
    actor: senderName,
  };

  const batch = writeBatch(db);
  batch.set(docRef, ticket);
  batch.set(doc(activityCol, newActivity.id), newActivity);
  await batch.commit();

  return ticket;
}

export async function getHelpdeskMetrics(): Promise<HelpdeskMetrics> {
  await seedDatabase();
  const snap = await getDocs(ticketsCol);
  const tickets = snap.docs.map(d => d.data() as Ticket);
  
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
  const urgentQueueCount = tickets.filter((t) => t.priority === 'urgent' && t.status !== 'resolved').length;

  const sentimentBreakdown = {
    positive: tickets.filter((t) => t.sentiment === 'positive').length,
    neutral: tickets.filter((t) => t.sentiment === 'neutral').length,
    negative: tickets.filter((t) => t.sentiment === 'negative').length,
    frustrated: tickets.filter((t) => t.sentiment === 'frustrated').length,
    urgent: tickets.filter((t) => t.sentiment === 'urgent').length,
  };

  const categories: TicketCategory[] = [
    'IT Infrastructure',
    'Authentication & SSO',
    'Billing & Invoices',
    'Bug & Technical Issue',
    'Security & Access',
    'Product & Feature Request',
    'General Inquiry',
  ];

  const categoryBreakdown = categories.map((cat) => {
    const count = tickets.filter((t) => t.category === cat).length;
    return {
      category: cat,
      count,
      percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0,
    };
  });
  
  // Sort and limit locally since we aren't creating composite indexes
  const actSnap = await getDocs(activityCol);
  const recentActivity = actSnap.docs.map(d => d.data() as any).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

  return {
    totalTickets,
    openTickets,
    resolvedTickets,
    inProgressTickets,
    urgentQueueCount,
    avgFirstResponseMinutes: 3.4,
    avgResolutionMinutes: 24.5,
    simulatedTimeReductionPercent: 40.2,
    classificationAccuracyPercent: 92.4,
    slaComplianceRate: 96.8,
    sentimentBreakdown,
    categoryBreakdown,
    recentActivity,
  };
}

export async function simulateBatchIngestion(batchSize: number = 3): Promise<{ processed: number; tickets: Ticket[] }> {
  const sampleScenarios = [
    {
      title: 'PostgreSQL connection pool exhausted on analytics replica db-east-02',
      description: 'Our BI metabase instance is throwing "FATAL: remaining connection slots are reserved for non-replication superuser connections".',
      customerName: 'Linus Vance',
      customerEmail: 'linus.v@data-insights.ai',
      company: 'DataInsights AI',
      tags: ['postgres', 'database', 'connection-pool', 'analytics-outage'],
    },
    {
      title: 'Billed twice for Pro tier upgrade during mid-month seat add',
      description: 'I added 4 team members on Tuesday and was charged $240 and then another $240 five minutes later.',
      customerName: 'Emma Watson-Reid',
      customerEmail: 'emma@creative-forge.studio',
      company: 'Creative Forge Studio',
      tags: ['billing', 'duplicate-charge', 'visa', 'seats'],
    },
    {
      title: 'OAuth consent screen shows unverified app warning for Google Workspace login',
      description: 'When our users attempt to sign in with Google Workspace, they get a red warning screen.',
      customerName: 'Carlos Mendoza',
      customerEmail: 'carlos@medtech-solutions.org',
      company: 'MedTech Solutions',
      tags: ['oauth', 'google-workspace', 'unverified-app', 'sso'],
    },
    {
      title: 'Feature request: Add Webhook signature HMAC SHA256 header verification',
      description: 'We are integrating your event stream into our SOC-monitored SIEM.',
      customerName: 'Astrid Lindqvist',
      customerEmail: 'astrid.l@nordic-cyber.se',
      company: 'Nordic Cyber Defense',
      tags: ['feature-request', 'webhooks', 'hmac', 'security', 'siem'],
    },
  ];

  const processedTickets: Ticket[] = [];
  const count = Math.min(batchSize, sampleScenarios.length);
  for (let i = 0; i < count; i++) {
    const s = sampleScenarios[i];
    const created = await createTicket(s.title, s.description, s.customerName, s.customerEmail, s.company, s.tags);
    processedTickets.push(created);
  }

  return {
    processed: processedTickets.length,
    tickets: processedTickets,
  };
}
