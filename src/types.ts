export type TicketCategory =
  | 'IT Infrastructure'
  | 'Authentication & SSO'
  | 'Billing & Invoices'
  | 'Bug & Technical Issue'
  | 'Security & Access'
  | 'Product & Feature Request'
  | 'General Inquiry';

export type TicketSentiment = 'positive' | 'neutral' | 'negative' | 'frustrated' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'escalated';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ResponseTone = 'professional' | 'empathetic' | 'technical' | 'concise';

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: 'customer' | 'agent' | 'ai_assistant';
  senderName: string;
  content: string;
  timestamp: string;
  isAiDraft?: boolean;
  confidence?: number;
  groundedSources?: string[];
}

export interface AIAnalysisResult {
  category: TicketCategory;
  categoryConfidence: number; // e.g. 0.94
  sentiment: TicketSentiment;
  sentimentScore: number; // -1.0 to 1.0
  urgencyLevel: TicketPriority;
  urgencyScore: number; // 1 to 10
  urgencyReasoning: string;
  summary: string;
  keyIssues: string[];
  recommendedDepartment: string;
  suggestedDraftReply: string;
  groundedArticles: string[];
  automatedResolutionPossible: boolean;
  processedAt: string;
  processingTimeMs: number;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. TCK-8492
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  company: string;
  category: TicketCategory;
  sentiment: TicketSentiment;
  sentimentScore: number;
  priority: TicketPriority;
  status: TicketStatus;
  tags: string[];
  assignedAgent?: string;
  assignedAgentEmail?: string;
  createdAt: string;
  updatedAt: string;
  slaMinutesRemaining: number;
  slaTotalMinutes: number;
  slaBreached: boolean;
  firstResponseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  messages: TicketMessage[];
  aiAnalysis: AIAnalysisResult;
  suggestedActions: string[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: TicketCategory;
  summary: string;
  content: string;
  tags: string[];
  lastUpdated: string;
  usageCount: number;
}

export type SmartTemplateCategory =
  | 'fix_protocol'
  | 'diagnostic'
  | 'escalation'
  | 'empathy'
  | 'closure';

export interface SmartResponseTemplate {
  id: string;
  title: string;
  templateType: SmartTemplateCategory;
  badgeLabel: string;
  description: string;
  fullContent: string;
  tone: ResponseTone;
  confidence: number;
  groundedKnowledgeArticles: string[];
  contextReason: string;
}


export interface HelpdeskMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  inProgressTickets: number;
  urgentQueueCount: number;
  avgFirstResponseMinutes: number;
  avgResolutionMinutes: number;
  simulatedTimeReductionPercent: number; // e.g. 40%
  classificationAccuracyPercent: number; // e.g. 92.4%
  slaComplianceRate: number; // e.g. 96.8%
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    frustrated: number;
    urgent: number;
  };
  categoryBreakdown: {
    category: TicketCategory;
    count: number;
    percentage: number;
  }[];
  recentActivity: {
    id: string;
    ticketNumber: string;
    action: string;
    timestamp: string;
    actor: string;
  }[];
}

export interface QuickReply {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  department: string;
  activeTickets: number;
  rating: number;
}
