const crypto = require('crypto');

const MARKETPLACE_TEMPLATES = [
  { id: 'tmpl-saas', name: 'SaaS Churn Prevention', category: 'retention', description: 'Monitors usage, NPS, and support sentiment to prevent churn', agents: ['Customer Agent'], setupTime: '15 min' },
  { id: 'tmpl-agency', name: 'Agency Margin Recovery', category: 'financial', description: 'Tracks project profitability, resource utilization, and billing', agents: ['Finance Agent', 'Operations Agent'], setupTime: '20 min' },
  { id: 'tmpl-ecom', name: 'E-commerce CAC Recovery', category: 'marketing', description: 'Optimizes ad spend ROI and identifies wasted budget', agents: ['Marketing Agent', 'Finance Agent'], setupTime: '10 min' },
  { id: 'tmpl-sales', name: 'Enterprise Pipeline Accelerator', category: 'sales', description: 'Identifies stalled deals and automates follow-up sequences', agents: ['Sales Agent'], setupTime: '10 min' },
  { id: 'tmpl-procurement', name: 'Procurement Cost Optimizer', category: 'operations', description: 'Analyzes vendor spend and negotiates better terms', agents: ['Finance Agent', 'Operations Agent'], setupTime: '25 min' },
  { id: 'tmpl-legal', name: 'Legal Compliance Monitor', category: 'compliance', description: 'Tracks regulatory changes and monitors contract compliance', agents: ['Knowledge Agent'], setupTime: '30 min' },
  { id: 'tmpl-hr', name: 'Recruiting Pipeline Manager', category: 'hr', description: 'Automates candidate sourcing, screening, and interview scheduling', agents: ['Operations Agent'], setupTime: '15 min' },
  { id: 'tmpl-support', name: 'Support SLA Enforcer', category: 'operations', description: 'Monitors response times, escalates breaches, and tracks satisfaction', agents: ['Customer Agent', 'Operations Agent'], setupTime: '10 min' }
];

let customAgents = [];

function getMarketplacePlaybooks() {
  return MARKETPLACE_TEMPLATES.map(t => ({
    ...t,
    installed: customAgents.some(a => a.templateId === t.id)
  }));
}

function installTemplate(data, templateId, config = {}) {
  const template = MARKETPLACE_TEMPLATES.find(t => t.id === templateId);
  if (!template) return { error: 'Template not found', status: 404 };

  const agentId = `agent-custom-${crypto.randomUUID().slice(0, 8)}`;
  const newAgent = {
    id: agentId,
    name: config.name || template.name,
    templateId: template.id,
    category: template.category,
    state: 'active',
    task: config.task || `Running ${template.name}`,
    autonomy: config.autonomy || 'Recommend',
    sources: config.sources || ['HubSpot', 'Slack', 'Email'],
    outcome: config.outcome || template.description,
    permissions: config.permissions || ['read', 'write'],
    createdAt: new Date().toISOString(),
    config: config
  };

  customAgents.push(newAgent);
  if (data.agents) {
    data.agents.push({
      id: agentId,
      name: newAgent.name,
      letter: 'C',
      outcome: newAgent.outcome,
      state: 'active',
      task: newAgent.task,
      autonomy: newAgent.autonomy,
      sources: newAgent.sources
    });
  }

  data.notifications.unshift({
    id: `studio-${Date.now()}`,
    kind: 'workflow',
    title: `🧩 Agent installed: ${newAgent.name}`,
    detail: `${template.category} playbook activated with ${template.agents.join(', ')}`,
    read: false,
    createdAt: new Date().toISOString()
  });

  return {
    agent: newAgent,
    template: template.name,
    message: `${template.name} installed successfully`
  };
}

function getCustomAgents() {
  return customAgents;
}

function removeAgent(agentId) {
  const idx = customAgents.findIndex(a => a.id === agentId);
  if (idx === -1) return { error: 'Agent not found', status: 404 };
  const [removed] = customAgents.splice(idx, 1);
  return { agent: removed, message: `${removed.name} removed` };
}

function getApprovalPolicies() {
  return [
    { id: 'pol-1', name: 'Default AI Autonomy', description: 'AI can create tasks and draft responses autonomously', scope: 'all_agents', level: 'create', editable: true },
    { id: 'pol-2', name: 'Budget Changes', description: 'Any advertising budget change requires CMO approval', scope: 'marketing', level: 'approval', approver: 'cmo', editable: true },
    { id: 'pol-3', name: 'Customer Communications', description: 'Outbound customer communications are draft-only until reviewed', scope: 'customer', level: 'draft', approver: 'manager', editable: true },
    { id: 'pol-4', name: 'Revenue Forecast Updates', description: 'Finance Agent can update forecasts but changes are audited', scope: 'finance', level: 'audit', editable: false },
    { id: 'pol-5', name: 'Pipeline Changes', description: 'Sales Agent can move deals between stages, but stage 4+ requires approval', scope: 'sales', level: 'approval', approver: 'cro', editable: true }
  ];
}

function updateApprovalPolicy(policyId, updates) {
  const policies = getApprovalPolicies();
  const policy = policies.find(p => p.id === policyId);
  if (!policy) return { error: 'Policy not found', status: 404 };
  if (!policy.editable) return { error: 'Policy is not editable', status: 403 };
  Object.assign(policy, updates);
  return { policy, message: 'Policy updated' };
}

module.exports = { getMarketplacePlaybooks, installTemplate, getCustomAgents, removeAgent, getApprovalPolicies, updateApprovalPolicy, MARKETPLACE_TEMPLATES };