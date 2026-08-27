import { GoogleGenAI, Type } from '@google/genai';
import {
  AIAnalysisResult,
  KnowledgeArticle,
  ResponseTone,
  SmartResponseTemplate,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketSentiment,
} from '../src/types';
import { ENTERPRISE_KNOWLEDGE_BASE } from './knowledgeBase';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export async function analyzeTicketWithAI(
  title: string,
  description: string,
  customerName?: string,
  company?: string
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  const ai = getGeminiClient();

  const kbContext = ENTERPRISE_KNOWLEDGE_BASE.map(
    (k) => `[ID: ${k.id}] Title: ${k.title} (Category: ${k.category})\nSummary: ${k.summary}\nGuidance: ${k.content.substring(0, 300)}`
  ).join('\n---\n');

  if (ai) {
    try {
      const prompt = `Analyze this incoming enterprise IT support ticket:
Customer: ${customerName || 'Unknown'} from ${company || 'Enterprise Account'}
Ticket Subject: "${title}"
Ticket Body:
"${description}"

Knowledge Base Reference:
${kbContext}

Classify and assess the ticket strictly in JSON according to this schema. Match the best category from:
- "IT Infrastructure"
- "Authentication & SSO"
- "Billing & Invoices"
- "Bug & Technical Issue"
- "Security & Access"
- "Product & Feature Request"
- "General Inquiry"

Assess sentiment: "positive", "neutral", "negative", "frustrated", "urgent".
Assess urgencyLevel: "low", "medium", "high", "urgent".
Provide a grounded, professional draft reply that cites relevant knowledge base guidance.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert Enterprise IT Support Lead and Automated Triage AI. Provide precise, objective classification, sentiment scoring (-1.0 to 1.0), urgency evaluation (1 to 10), and empathetic, highly actionable solution drafts.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: 'One of the valid category names' },
              categoryConfidence: { type: Type.NUMBER, description: 'Confidence score between 0.0 and 1.0 (e.g. 0.94)' },
              sentiment: { type: Type.STRING, description: 'positive, neutral, negative, frustrated, or urgent' },
              sentimentScore: { type: Type.NUMBER, description: 'Score between -1.0 and 1.0' },
              urgencyLevel: { type: Type.STRING, description: 'low, medium, high, or urgent' },
              urgencyScore: { type: Type.INTEGER, description: 'Urgency score from 1 to 10' },
              urgencyReasoning: { type: Type.STRING, description: 'Short rationale for urgency' },
              summary: { type: Type.STRING, description: 'One sentence concise summary of problem' },
              keyIssues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key technical symptoms detected',
              },
              recommendedDepartment: { type: Type.STRING, description: 'E.g. Tier 2 DevOps, Billing Ops, IAM Sec' },
              suggestedDraftReply: { type: Type.STRING, description: 'Complete, courteous, solution-focused reply' },
              groundedArticles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Matching KB article IDs or titles',
              },
              automatedResolutionPossible: { type: Type.BOOLEAN, description: 'Whether AI can resolve without human intervention' },
            },
            required: [
              'category',
              'categoryConfidence',
              'sentiment',
              'sentimentScore',
              'urgencyLevel',
              'urgencyScore',
              'urgencyReasoning',
              'summary',
              'keyIssues',
              'recommendedDepartment',
              'suggestedDraftReply',
              'groundedArticles',
              'automatedResolutionPossible',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const validCategories: TicketCategory[] = [
        'IT Infrastructure',
        'Authentication & SSO',
        'Billing & Invoices',
        'Bug & Technical Issue',
        'Security & Access',
        'Product & Feature Request',
        'General Inquiry',
      ];
      const validSentiments: TicketSentiment[] = ['positive', 'neutral', 'negative', 'frustrated', 'urgent'];
      const validPriorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

      const finalCategory: TicketCategory = validCategories.includes(parsed.category as TicketCategory)
        ? (parsed.category as TicketCategory)
        : 'Bug & Technical Issue';

      const finalSentiment: TicketSentiment = validSentiments.includes(parsed.sentiment as TicketSentiment)
        ? (parsed.sentiment as TicketSentiment)
        : 'neutral';

      const finalPriority: TicketPriority = validPriorities.includes(parsed.urgencyLevel as TicketPriority)
        ? (parsed.urgencyLevel as TicketPriority)
        : 'medium';

      return {
        category: finalCategory,
        categoryConfidence: Math.max(0.7, Math.min(0.99, Number(parsed.categoryConfidence) || 0.92)),
        sentiment: finalSentiment,
        sentimentScore: Number(parsed.sentimentScore) || (finalSentiment === 'frustrated' ? -0.8 : 0.1),
        urgencyLevel: finalPriority,
        urgencyScore: Math.min(10, Math.max(1, Number(parsed.urgencyScore) || 5)),
        urgencyReasoning: parsed.urgencyReasoning || 'Assessed based on business impact and error severity.',
        summary: parsed.summary || `${title}: Customer experiencing technical inquiry.`,
        keyIssues: Array.isArray(parsed.keyIssues) && parsed.keyIssues.length > 0 ? parsed.keyIssues : ['Reported service impact'],
        recommendedDepartment: parsed.recommendedDepartment || 'Tier 2 Engineering Support',
        suggestedDraftReply: parsed.suggestedDraftReply || 'Hello,\n\nThank you for reaching out. We are investigating your report and will update you promptly.',
        groundedArticles: Array.isArray(parsed.groundedArticles) ? parsed.groundedArticles : [],
        automatedResolutionPossible: Boolean(parsed.automatedResolutionPossible),
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn('Gemini API call failed, using intelligent rule-based triage:', err instanceof Error ? err.message : String(err));
    }
  }

  // Fallback intelligent heuristics engine if API key is not ready or rate-limited
  return generateHeuristicAnalysis(title, description, customerName, company, startTime);
}

export async function generateCustomDraftReply(
  ticketTitle: string,
  ticketDescription: string,
  customerName: string,
  category: TicketCategory,
  sentiment: TicketSentiment,
  tone: ResponseTone,
  customInstructions?: string
): Promise<{ draft: string; groundedSources: string[] }> {
  const ai = getGeminiClient();
  const relevantArticles = ENTERPRISE_KNOWLEDGE_BASE.filter(
    (a) => a.category === category || ticketDescription.toLowerCase().includes(a.tags[0])
  );

  const matchedArticle = relevantArticles[0] || ENTERPRISE_KNOWLEDGE_BASE[0];

  if (ai) {
    try {
      const prompt = `Draft an enterprise support reply for ticket:
Customer: ${customerName}
Title: "${ticketTitle}"
Description: "${ticketDescription}"
Category: ${category}
Customer Sentiment: ${sentiment}
Desired Response Tone: ${tone} (Options: professional, empathetic, technical, concise)
Custom Guidance from Agent: ${customInstructions || 'Provide standard troubleshooting and clear next steps.'}

Relevant Knowledge Base Guidance:
Title: ${matchedArticle.title}
Guidance Content: ${matchedArticle.content}

Instructions:
1. Address ${customerName} politely.
2. Adapt strictly to the requested "${tone}" tone. For "empathetic", acknowledge frustration with warmth. For "technical", include exact diagnostic commands/steps. For "concise", deliver direct bullet points.
3. Incorporate facts from the Knowledge Base article without robotic phrasing.
4. Sign off from "Enterprise Customer Support Team".`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: 'You are an award-winning Enterprise Support Specialist.',
        },
      });

      return {
        draft: response.text?.trim() || `Hello ${customerName},\n\nThank you for contacting Enterprise Support regarding "${ticketTitle}". We are actively reviewing this and have escalated to our engineering team.`,
        groundedSources: [matchedArticle.title],
      };
    } catch (err) {
      console.warn('Gemini custom draft generation error:', err instanceof Error ? err.message : String(err));
    }
  }

  // Heuristic template fallback
  let draft = '';
  if (tone === 'empathetic') {
    draft = `Hi ${customerName},\n\nI completely understand how frustrating it is to encounter this issue with "${ticketTitle}". I apologize for the disruption this has caused to your workflow.\n\nOur team has reviewed your details against our ${matchedArticle.title} guidelines. Please check if applying the following steps resolves the issue:\n\n${matchedArticle.content.split('\n').slice(0, 3).join('\n')}\n\nWe're standing by if you need further assistance!`;
  } else if (tone === 'technical') {
    draft = `Hello ${customerName},\n\nRegarding ticket "${ticketTitle}" in category ${category}:\n\nRoot Cause Analysis:\n- Initial telemetry indicates subsystem mismatch under ${matchedArticle.tags.join(', ')}.\n\nRecommended Remediation:\n${matchedArticle.content}\n\nIf the status remains unresolved, please provide the full client request payload with correlation ID for Tier 3 escalation.`;
  } else if (tone === 'concise') {
    draft = `Hi ${customerName},\n\nQuick update on "${ticketTitle}":\n\n1. Please follow our resolution protocol for ${matchedArticle.title}.\n2. Key step: ${matchedArticle.content.split('\n')[0]}\n3. Let us know if you require additional verification.`;
  } else {
    draft = `Dear ${customerName},\n\nThank you for reaching out to Enterprise Support regarding "${ticketTitle}".\n\nBased on your inquiry, we recommend following our verified troubleshooting procedure:\n\n${matchedArticle.content.split('\n').slice(0, 4).join('\n')}\n\nPlease let us know if this resolves the issue or if you would like us to arrange a quick troubleshooting call.\n\nBest regards,\nEnterprise Support Team`;
  }

  return {
    draft,
    groundedSources: [matchedArticle.title],
  };
}

export async function generateSmartResponseTemplates(
  ticket: Ticket,
  tone: ResponseTone = 'professional',
  customInstructions?: string
): Promise<SmartResponseTemplate[]> {
  const ai = getGeminiClient();

  // Find relevant knowledge base articles
  const matchingArticles = ENTERPRISE_KNOWLEDGE_BASE.filter(
    (a) =>
      a.category === ticket.category ||
      ticket.tags.some((tag) => a.tags.includes(tag.toLowerCase())) ||
      ticket.description.toLowerCase().includes(a.category.toLowerCase().split(' ')[0])
  );
  const primaryArticle = matchingArticles[0] || ENTERPRISE_KNOWLEDGE_BASE[0];
  const secondaryArticle = matchingArticles[1] || ENTERPRISE_KNOWLEDGE_BASE[1];

  const conversationHistory = ticket.messages
    .map((m) => `[${m.sender.toUpperCase()} - ${m.senderName}]: ${m.content}`)
    .join('\n');

  if (ai) {
    try {
      const prompt = `Generate 4 context-aware enterprise customer support response templates for this ticket:
Customer: ${ticket.customerName} (${ticket.customerEmail}) from ${ticket.company}
Ticket #${ticket.ticketNumber}: "${ticket.title}"
Category: ${ticket.category}
Priority / Urgency: ${ticket.priority} (Urgency Score: ${ticket.aiAnalysis.urgencyScore}/10)
Sentiment: ${ticket.sentiment} (${ticket.sentimentScore})
Summary: ${ticket.aiAnalysis.summary}
Key Issues: ${ticket.aiAnalysis.keyIssues.join(', ')}

Conversation History:
${conversationHistory || ticket.description}

Primary Knowledge Base Runbook:
Title: ${primaryArticle.title}
Content: ${primaryArticle.content}

Requested Tone: ${tone}
${customInstructions ? `Additional Agent Guidance: ${customInstructions}` : ''}

Generate exactly 4 distinct response templates in JSON format matching the schema:
1. "fix_protocol": Step-by-step verified troubleshooting solution grounded directly in the Knowledge Base runbook.
2. "diagnostic": Request for technical logs, payload traces, screenshots, or environment details to pinpoint root cause.
3. "escalation": Urgent SLA acknowledgment committing to Tier-2/Tier-3 engineering priority review with timeline.
4. "empathy": High-warmth empathetic response acknowledging business impact and disruption, especially tuned for negative/frustrated sentiment.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert Enterprise Support Copilot. Output 4 rich, distinct, polished response templates for enterprise IT support.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING, description: 'Short descriptive template title' },
                templateType: {
                  type: Type.STRING,
                  description: 'fix_protocol, diagnostic, escalation, empathy, or closure',
                },
                badgeLabel: { type: Type.STRING, description: 'Category pill label, e.g. "Remediation Protocol"' },
                description: { type: Type.STRING, description: 'Brief 1-sentence explanation of when to use this template' },
                fullContent: { type: Type.STRING, description: 'Complete, courteous, markdown-ready response message' },
                confidence: { type: Type.NUMBER, description: 'Matching confidence between 0.80 and 0.99' },
                groundedKnowledgeArticles: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                contextReason: { type: Type.STRING, description: 'Why this template fits the current ticket context' },
              },
              required: [
                'id',
                'title',
                'templateType',
                'badgeLabel',
                'description',
                'fullContent',
                'confidence',
                'groundedKnowledgeArticles',
                'contextReason',
              ],
            },
          },
        },
      });

      const parsed: SmartResponseTemplate[] = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          ...item,
          id: item.id || `tpl-${Date.now()}-${idx}`,
          tone,
          groundedKnowledgeArticles:
            item.groundedKnowledgeArticles && item.groundedKnowledgeArticles.length > 0
              ? item.groundedKnowledgeArticles
              : [primaryArticle.title],
        }));
      }
    } catch (err) {
      console.warn('Gemini smart template generation failed, using intelligent heuristics:', err instanceof Error ? err.message : String(err));
    }
  }

  // Robust Heuristic Fallback Templates
  return generateHeuristicTemplates(ticket, primaryArticle, secondaryArticle, tone);
}

function generateHeuristicTemplates(
  ticket: Ticket,
  primaryKb: KnowledgeArticle,
  secondaryKb: KnowledgeArticle,
  tone: ResponseTone
): SmartResponseTemplate[] {
  const cName = ticket.customerName || 'there';
  const kbSteps = primaryKb.content.split('\n').filter((l) => l.trim().length > 0);

  const templates: SmartResponseTemplate[] = [
    {
      id: `tpl-${ticket.id}-fix`,
      title: `Step-by-Step Fix Protocol (${primaryKb.category})`,
      templateType: 'fix_protocol',
      badgeLabel: 'Verified Solution',
      description: `Actionable resolution steps grounded directly in "${primaryKb.title}".`,
      fullContent: `Hello ${cName},\n\nThank you for reaching out to Enterprise Support regarding "${ticket.title}".\n\nBased on our initial triage and verified runbook (${primaryKb.title}), please apply the following resolution procedure:\n\n${kbSteps.slice(0, 4).join('\n')}\n\nPlease test this in your environment and let us know if the issue is resolved.\n\nBest regards,\nEnterprise Support Team`,
      tone,
      confidence: 0.96,
      groundedKnowledgeArticles: [primaryKb.title],
      contextReason: `Matched runbook "${primaryKb.title}" with 96% confidence based on category "${ticket.category}".`,
    },
    {
      id: `tpl-${ticket.id}-diag`,
      title: 'Diagnostic & Telemetry Request',
      templateType: 'diagnostic',
      badgeLabel: 'Diagnostic Protocol',
      description: 'Request exact error logs, correlation request IDs, and environment details.',
      fullContent: `Hi ${cName},\n\nWe are actively investigating the issue you reported with "${ticket.title}". To help our engineering team pinpoint the root cause quickly, could you provide the following details:\n\n1. Timestamp of the most recent occurrence (with timezone)\n2. Client request Correlation ID / Transaction ID or HTTP response payload\n3. Affected user accounts or endpoints\n4. Relevant screenshot or error log snippet\n\nOnce received, we will run deep trace analytics through our diagnostic cluster.\n\nThank you,\nEnterprise Technical Support`,
      tone,
      confidence: 0.92,
      groundedKnowledgeArticles: [primaryKb.title, secondaryKb.title],
      contextReason: `Identified key technical issues (${ticket.aiAnalysis.keyIssues.slice(0, 2).join(', ')}) requiring diagnostic log data.`,
    },
    {
      id: `tpl-${ticket.id}-escl`,
      title: `Priority SLA Escalation (${ticket.priority.toUpperCase()})`,
      templateType: 'escalation',
      badgeLabel: 'Escalation & SLA',
      description: `Commit to target SLA timeline and dispatch to ${ticket.aiAnalysis.recommendedDepartment}.`,
      fullContent: `Dear ${cName},\n\nI have reviewed your ticket regarding "${ticket.title}" and escalated this to our ${ticket.aiAnalysis.recommendedDepartment} under Priority Tier ${ticket.priority.toUpperCase()}.\n\nOur on-call engineers are currently analyzing the incident telemetry. Our target SLA resolution window is ${ticket.slaTotalMinutes || 60} minutes, and we will update you as soon as the initial patch or remediation is deployed.\n\nPriority Case Reference: #${ticket.ticketNumber}\n\nSincerely,\nEscalations Lead, Enterprise Operations`,
      tone,
      confidence: 0.94,
      groundedKnowledgeArticles: [primaryKb.title],
      contextReason: `Configured for Priority ${ticket.priority.toUpperCase()} with ${ticket.slaMinutesRemaining}m remaining on resolution timer.`,
    },
    {
      id: `tpl-${ticket.id}-emp`,
      title: 'Empathetic Acknowledgment & Remediation',
      templateType: 'empathy',
      badgeLabel: 'High Empathy',
      description: 'Acknowledge operational disruption with genuine empathy and immediate next steps.',
      fullContent: `Hi ${cName},\n\nI truly appreciate your patience and completely understand how frustrating it is to deal with "${ticket.title}". I apologize for the disruption this has caused to your team's operations at ${ticket.company}.\n\nWe have expedited this case and are treating it with high urgency. We are applying the protocol from our ${primaryKb.title} to ensure this is resolved permanently.\n\nI am personally monitoring this ticket and will keep you informed at every step.\n\nWarm regards,\nEnterprise Client Success Team`,
      tone,
      confidence: 0.91,
      groundedKnowledgeArticles: [primaryKb.title],
      contextReason: `Detected customer sentiment "${ticket.sentiment}" (score: ${ticket.sentimentScore}).`,
    },
    {
      id: `tpl-${ticket.id}-close`,
      title: 'Resolution Verification & Self-Serve Guidance',
      templateType: 'closure',
      badgeLabel: 'Resolution Confirmation',
      description: 'Confirm that customer requirements are fulfilled and offer self-serve documentation.',
      fullContent: `Hello ${cName},\n\nWe have completed our investigation and applied the necessary updates for "${ticket.title}".\n\nPlease verify that your system is functioning normally. You can also review our self-service runbook "${primaryKb.title}" for reference.\n\nIf you have any remaining questions, please reply directly to this message. Otherwise, we will mark this ticket as resolved.\n\nBest regards,\nEnterprise Support Team`,
      tone,
      confidence: 0.89,
      groundedKnowledgeArticles: [primaryKb.title],
      contextReason: 'Appropriate for closing tickets with confirmed resolution or providing verified knowledge links.',
    },
  ];

  return templates;
}


function generateHeuristicAnalysis(
  title: string,
  description: string,
  customerName?: string,
  company?: string,
  startTime: number = Date.now()
): AIAnalysisResult {
  const combined = `${title} ${description}`.toLowerCase();

  let category: TicketCategory = 'General Inquiry';
  let categoryConfidence = 0.91;
  let department = 'General Helpdesk';
  let grounded: string[] = [];

  if (combined.includes('sso') || combined.includes('okta') || combined.includes('saml') || combined.includes('login') || combined.includes('403')) {
    category = 'Authentication & SSO';
    department = 'Identity & Access Management (IAM)';
    grounded = ['kb-sso-01'];
    categoryConfidence = 0.95;
  } else if (combined.includes('invoice') || combined.includes('billing') || combined.includes('charge') || combined.includes('refund') || combined.includes('credit card') || combined.includes('stripe')) {
    category = 'Billing & Invoices';
    department = 'Finance & Accounts Operations';
    grounded = ['kb-billing-02'];
    categoryConfidence = 0.94;
  } else if (combined.includes('vpn') || combined.includes('latency') || combined.includes('gateway') || combined.includes('dns') || combined.includes('firewall') || combined.includes('outage') || combined.includes('server')) {
    category = 'IT Infrastructure';
    department = 'Site Reliability Engineering (SRE)';
    grounded = ['kb-it-03'];
    categoryConfidence = 0.93;
  } else if (combined.includes('mfa') || combined.includes('totp') || combined.includes('permission') || combined.includes('breach') || combined.includes('locked out') || combined.includes('rbac')) {
    category = 'Security & Access';
    department = 'SecOps & Compliance';
    grounded = ['kb-security-04'];
    categoryConfidence = 0.96;
  } else if (combined.includes('rate limit') || combined.includes('429') || combined.includes('bug') || combined.includes('webhook') || combined.includes('exception') || combined.includes('crash') || combined.includes('error')) {
    category = 'Bug & Technical Issue';
    department = 'Tier 2 Core Engineering';
    grounded = ['kb-bug-05'];
    categoryConfidence = 0.92;
  } else if (combined.includes('export') || combined.includes('gdpr') || combined.includes('feature') || combined.includes('roadmap') || combined.includes('soc2') || combined.includes('dashboard')) {
    category = 'Product & Feature Request';
    department = 'Product & Governance';
    grounded = ['kb-prod-06'];
    categoryConfidence = 0.89;
  }

  // Sentiment analysis
  let sentiment: TicketSentiment = 'neutral';
  let sentimentScore = 0.0;
  let urgencyLevel: TicketPriority = 'medium';
  let urgencyScore = 5;
  let urgencyReasoning = 'Standard operational queue priority.';

  if (
    combined.includes('urgent') ||
    combined.includes('production down') ||
    combined.includes('outage') ||
    combined.includes('critical') ||
    combined.includes('immediately') ||
    combined.includes('asap') ||
    combined.includes('revenue')
  ) {
    sentiment = 'urgent';
    sentimentScore = -0.75;
    urgencyLevel = 'urgent';
    urgencyScore = 9;
    urgencyReasoning = 'High business impact or customer-declared production emergency.';
  } else if (
    combined.includes('furious') ||
    combined.includes('unacceptable') ||
    combined.includes('ridiculous') ||
    combined.includes('angry') ||
    combined.includes('broken again') ||
    combined.includes('wasting time') ||
    combined.includes('charged twice')
  ) {
    sentiment = 'frustrated';
    sentimentScore = -0.85;
    urgencyLevel = 'high';
    urgencyScore = 8;
    urgencyReasoning = 'Customer expresses high emotional friction and escalation risk.';
  } else if (combined.includes('not working') || combined.includes('failed') || combined.includes('trouble') || combined.includes('error')) {
    sentiment = 'negative';
    sentimentScore = -0.4;
    urgencyLevel = 'medium';
    urgencyScore = 6;
    urgencyReasoning = 'Impaired functionality requiring technical diagnosis.';
  } else if (combined.includes('thanks') || combined.includes('great') || combined.includes('love') || combined.includes('appreciate')) {
    sentiment = 'positive';
    sentimentScore = 0.8;
    urgencyLevel = 'low';
    urgencyScore = 2;
    urgencyReasoning = 'Constructive inquiry with positive stakeholder sentiment.';
  }

  const kbArticle = ENTERPRISE_KNOWLEDGE_BASE.find((k) => k.id === grounded[0]) || ENTERPRISE_KNOWLEDGE_BASE[0];

  return {
    category,
    categoryConfidence,
    sentiment,
    sentimentScore,
    urgencyLevel,
    urgencyScore,
    urgencyReasoning,
    summary: `${title}: ${description.substring(0, 100)}...`,
    keyIssues: [`Detected category indicator: ${category}`, `Sentiment assessment: ${sentiment} (${sentimentScore.toFixed(2)})`],
    recommendedDepartment: department,
    suggestedDraftReply: `Hello ${customerName || 'there'},\n\nThank you for contacting Enterprise Support. We have analyzed your ticket regarding "${title}".\n\nBased on our initial triage (${category}), here is our recommended troubleshooting procedure:\n\n${kbArticle.content.split('\n').slice(0, 3).join('\n')}\n\nPlease let us know if you need us to investigate further.\n\nBest regards,\nEnterprise Support Desk`,
    groundedArticles: grounded.map((id) => ENTERPRISE_KNOWLEDGE_BASE.find((k) => k.id === id)?.title || id),
    automatedResolutionPossible: urgencyScore < 7,
    processedAt: new Date().toISOString(),
    processingTimeMs: Date.now() - startTime,
  };
}
