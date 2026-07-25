const crypto = require('crypto');
const { generateResponse, generateStructuredResponse, getAIStatus } = require('./ai-provider');
const EXECUTION_LANE = 'In progress';

// AI Investigation Engine — uses real AI via OpenRouter, falls back to simulation
const TOOLS = {
  analyze_crm: { description: 'Analyze CRM data for pipeline changes', execute: (params) => ({ findings: `CRM analysis: ${params.focus}`, confidence: 0.91 }) },
  analyze_ads: { description: 'Analyze ad platform performance', execute: (params) => ({ findings: `Ad analysis: ${params.focus}`, confidence: 0.88 }) },
  analyze_support: { description: 'Analyze support ticket sentiment', execute: (params) => ({ findings: `Support analysis: ${params.focus}`, confidence: 0.85 }) },
  analyze_finance: { description: 'Analyze financial data', execute: (params) => ({ findings: `Finance analysis: ${params.focus}`, confidence: 0.93 }) },
  search_knowledge: { description: 'Search company knowledge base', execute: (params) => ({ findings: `Knowledge search: ${params.query}`, confidence: 0.96 }) }
};

const AGENT_ROUTER = {
  'sales': { tools: ['analyze_crm'], focus: 'pipeline, deals, response times' },
  'marketing': { tools: ['analyze_ads'], focus: 'campaigns, spend, conversion' },
  'customer': { tools: ['analyze_support'], focus: 'sentiment, retention, churn' },
  'finance': { tools: ['analyze_finance'], focus: 'revenue, costs, runway' },
  'knowledge': { tools: ['search_knowledge'], focus: 'company context, history' }
};

const BUSINESS_CONTEXT = `Axiom OS — AI-Powered Business Execution System.
Current metrics: Monthly Revenue $842,120, Pipeline Coverage 2.7×, NRR 112.6%, Cash Runway 18.4mo.
SQLs: 4,218 (down 24%), Opportunities: 312, Won Deals: 87, At Risk: 24.
EU Campaign: Active (down 18%), US Campaign: Active (up 4%).
Key customers: Acme Corp ($12k MRR), Globex Inc ($8.5k MRR, up 34%), Hooli ($15k MRR, down 55%), Wayne Enterprises ($20k MRR, down 12%).
Active agents: Sales, Marketing, Customer, Finance, Operations, CEO.`;

function llmRoute(question) {
  const q = question.toLowerCase();
  const agents = [];
  if (q.includes('sale') || q.includes('pipeline') || q.includes('deal') || q.includes('revenue')) agents.push('sales', 'marketing', 'finance');
  if (q.includes('market') || q.includes('campaign') || q.includes('ad') || q.includes('spend')) agents.push('marketing');
  if (q.includes('customer') || q.includes('churn') || q.includes('support') || q.includes('retention')) agents.push('customer');
  if (q.includes('cost') || q.includes('cash') || q.includes('runway') || q.includes('profit')) agents.push('finance');
  if (q.includes('operation') || q.includes('process') || q.includes('workflow') || q.includes('sla')) agents.push('operations');
  if (agents.length === 0) agents.push('sales', 'marketing', 'customer', 'finance', 'operations', 'knowledge');
  return [...new Set(agents)];
}

async function llmGeneratePlan(question, evidence) {
  // Try AI first
  const systemPrompt = `Ты — стратегический AI-планировщик Axiom OS. На основе вопроса CEO и собранных доказательств, создай план действий.
Ответь в формате JSON: { "plan": ["шаг1", "шаг2", ...], "priority": "high|medium|low", "timeline": "string" }`;
  
  const userPrompt = `Вопрос CEO: ${question}\n\nКонтекст бизнеса:\n${BUSINESS_CONTEXT}\n\nДоказательства:\n${JSON.stringify(evidence, null, 2)}\n\nСоздай план действий. Верни только JSON.`;
  
  const aiResult = await generateStructuredResponse(systemPrompt, userPrompt, {
    plan: ['string'],
    priority: 'string',
    timeline: 'string'
  }, { temperature: 0.3 });

  if (aiResult && aiResult.parsed && aiResult.parsed.plan) {
    return aiResult.parsed.plan;
  }

  // Fallback to simulation
  const plan = [];
  if (evidence.some(e => e.title.includes('SQL') || e.title.includes('campaign'))) {
    plan.push('Restore high-intent audience and optimize campaign targeting');
  }
  if (evidence.some(e => e.title.includes('response') || e.title.includes('SLA'))) {
    plan.push('Implement lead response SLA with automated escalation');
  }
  if (evidence.some(e => e.title.includes('sentiment') || e.title.includes('renewal'))) {
    plan.push('Trigger customer health interventions for at-risk accounts');
  }
  if (plan.length === 0) {
    plan.push('Conduct deep-dive analysis across all data sources');
    plan.push('Schedule cross-functional review with AI recommendations');
  }
  return plan;
}

async function createInvestigation(question) {
  const safeQuestion = typeof question === 'string' && question.trim() ? question.trim().slice(0, 500) : 'Why did sales drop in Europe?';
  const routedAgents = llmRoute(safeQuestion);
  
  // Try AI-powered investigation
  const systemPrompt = `Ты — AI-детектив Axiom OS. На основе вопроса CEO, проведи расследование.
Проанализируй бизнес-контекст и создай структурированный отчет.
Ответь в формате JSON:
{
  "summary": "краткое резюме ситуации",
  "confidence": 85,
  "impact": "потенциальное влияние в долларах",
  "evidence": [{ "title": "string", "detail": "string", "confidence": 0.9, "source": "string" }],
  "plan": ["шаг1", "шаг2"]
}`;

  const userPrompt = `Вопрос CEO: ${safeQuestion}\n\nКонтекст бизнеса:\n${BUSINESS_CONTEXT}\n\nПривлеченные агенты: ${routedAgents.join(', ')}\n\nПроведи расследование и верни JSON.`;
  
  const aiResult = await generateStructuredResponse(systemPrompt, userPrompt, {
    summary: 'string',
    confidence: 0,
    impact: 'string',
    evidence: [{ title: 'string', detail: 'string', confidence: 0.9, source: 'string' }],
    plan: ['string']
  }, { temperature: 0.3, maxTokens: 800 });

  if (aiResult && aiResult.parsed) {
    const inv = aiResult.parsed;
    return {
      id: crypto.randomUUID(),
      question: safeQuestion,
      createdAt: new Date().toISOString(),
      confidence: inv.confidence || 85,
      status: 'awaiting_approval',
      summary: inv.summary || `AI Investigation: ${safeQuestion}`,
      impact: inv.impact || '$42–71k this quarter',
      agents: routedAgents.map(a => a.charAt(0).toUpperCase() + a.slice(1) + ' Agent'),
      agentDetails: routedAgents.map(id => ({ id, tools: AGENT_ROUTER[id]?.tools || [] })),
      evidence: (inv.evidence || []).slice(0, 5).map(e => ({
        title: e.title,
        detail: e.detail,
        confidence: e.confidence
      })),
      plan: inv.plan || [],
      citations: (inv.evidence || []).map(e => ({ source: e.source, finding: e.title, confidence: e.confidence })),
      aiGenerated: true
    };
  }

  // Fallback to simulation
  const evidence = [];
  const agentDetails = [];

  routedAgents.forEach(agentId => {
    const config = AGENT_ROUTER[agentId];
    if (!config) return;
    const agentEvidence = config.tools.map(toolId => {
      const tool = TOOLS[toolId];
      if (!tool) return null;
      const result = tool.execute({ focus: config.focus, query: safeQuestion });
      return {
        agent: agentId,
        tool: toolId,
        finding: result.findings,
        confidence: result.confidence
      };
    }).filter(Boolean);
    agentDetails.push({ id: agentId, tools: config.tools, evidence: agentEvidence });
    agentEvidence.forEach(ae => {
      evidence.push({
        title: `${agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent: ${ae.finding}`,
        detail: `Tool: ${ae.tool} | Confidence: ${(ae.confidence * 100).toFixed(0)}%`,
        confidence: ae.confidence,
        source: agentId
      });
    });
  });

  const avgConfidence = evidence.length > 0
    ? Math.round(evidence.reduce((s, e) => s + e.confidence, 0) / evidence.length * 100)
    : 85;

  const plan = await llmGeneratePlan(safeQuestion, evidence);

  return {
    id: crypto.randomUUID(),
    question: safeQuestion,
    createdAt: new Date().toISOString(),
    confidence: avgConfidence,
    status: 'awaiting_approval',
    summary: `AI Investigation: ${safeQuestion}`,
    impact: '$42–71k this quarter',
    agents: routedAgents.map(a => a.charAt(0).toUpperCase() + a.slice(1) + ' Agent'),
    agentDetails,
    evidence: evidence.slice(0, 5).map((e, i) => ({
      title: e.title,
      detail: e.detail,
      confidence: e.confidence
    })),
    plan,
    citations: evidence.map(e => ({ source: e.source, finding: e.finding, confidence: e.confidence })),
    aiGenerated: false
  };
}

function approveInvestigation(data, id) {
  const investigation = data.investigations.find((item) => item.id === id);
  if (!investigation) return { error: 'Investigation not found', status: 404 };
  if (investigation.status === 'approved') return { error: 'Investigation already approved', status: 409 };
  investigation.status = 'approved';
  data.tasks.unshift({ id: crypto.randomUUID(), lane: EXECUTION_LANE, domain: 'Revenue', title: 'Recover EU pipeline: approved 21-day plan', owner: 'Sales + Marketing Agents', due: 'Started', status: 'active' });
  return { investigation, tasks: data.tasks };
}

module.exports = { createInvestigation, approveInvestigation, llmRoute, TOOLS, AGENT_ROUTER, EXECUTION_LANE };
