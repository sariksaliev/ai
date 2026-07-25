const crypto = require('crypto');

// Decision Registry — централизованный реестр всех бизнес-решений
// Каждое решение: статус, owner, impact, связанные workflow и KR

function recordDecision(data, body, actor) {
  if (!data.decisionRegistry) data.decisionRegistry = [];
  
  const decision = {
    id: `dreg_${Date.now()}`,
    title: body.title || 'Бизнес-решение',
    description: body.description || '',
    category: body.category || 'strategic', // strategic, operational, financial, customer
    priority: body.priority || 'medium', // critical, high, medium, low
    status: body.status || 'approved', // proposed, approved, in_progress, completed, rejected, cancelled
    impact: body.impact || null,
    metrics: body.metrics || [],
    owner: actor?.name || body.owner || 'CEO',
    stakeholders: body.stakeholders || [],
    source: body.source || 'manual', // manual, investigation, chat, ai_suggestion, workflow
    sourceId: body.sourceId || null,
    linkedKR: body.linkedKR || [],
    linkedWorkflow: body.linkedWorkflow || [],
    riskLevel: body.riskLevel || 'low', // low, medium, high, critical
    expectedValue: body.expectedValue || null,
    actualValue: body.actualValue || null,
    dueDate: body.dueDate || null,
    completedAt: null,
    tags: body.tags || [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.decisionRegistry.unshift(decision);
  return decision;
}

function getDecisionRegistry(data, filters = {}) {
  if (!data.decisionRegistry) data.decisionRegistry = [];
  let decisions = [...data.decisionRegistry];
  
  if (filters.status) decisions = decisions.filter(d => d.status === filters.status);
  if (filters.category) decisions = decisions.filter(d => d.category === filters.category);
  if (filters.priority) decisions = decisions.filter(d => d.priority === filters.priority);
  
  // Calculate aggregated metrics
  const stats = {
    total: data.decisionRegistry.length,
    byStatus: {},
    byCategory: {},
    byPriority: {},
    totalExpectedValue: 0,
    totalActualValue: 0,
    onTrack: 0
  };
  
  data.decisionRegistry.forEach(d => {
    stats.byStatus[d.status] = (stats.byStatus[d.status] || 0) + 1;
    stats.byCategory[d.category] = (stats.byCategory[d.category] || 0) + 1;
    stats.byPriority[d.priority] = (stats.byPriority[d.priority] || 0) + 1;
    if (d.expectedValue) stats.totalExpectedValue += d.expectedValue;
    if (d.actualValue) stats.totalActualValue += d.actualValue;
    if (d.status !== 'rejected' && d.status !== 'cancelled') stats.onTrack++;
  });
  
  return { decisions, stats };
}

function updateDecisionStatus(data, decisionId, status, result) {
  const decision = (data.decisionRegistry || []).find(d => d.id === decisionId);
  if (!decision) return null;
  
  decision.status = status;
  decision.updatedAt = new Date().toISOString();
  
  if (status === 'completed') {
    decision.completedAt = new Date().toISOString();
    if (result?.actualValue) decision.actualValue = result.actualValue;
  }
  
  if (result?.notes) {
    decision.notes.push({
      text: result.notes,
      timestamp: new Date().toISOString(),
      author: result.author || 'System'
    });
  }
  
  return decision;
}

function getDecisionTimeline(data, decisionId) {
  const decision = (data.decisionRegistry || []).find(d => d.id === decisionId);
  if (!decision) return null;
  
  return {
    decision: {
      id: decision.id,
      title: decision.title,
      status: decision.status
    },
    timeline: [
      { event: 'decision.created', timestamp: decision.createdAt, detail: 'Решение создано' },
      { event: 'decision.status_changed', timestamp: decision.updatedAt, detail: `Статус: ${decision.status}` }
    ],
    linkedItems: {
      workflows: (data.workflows || []).filter(w => w.sourceDecisionId === decisionId || decision.linkedWorkflow?.includes(w.id)),
      tasks: (data.tasks || []).filter(t => t.sourceDecisionId === decisionId)
    }
  };
}

function linkDecisionToWorkflow(data, decisionId, workflowId) {
  const decision = (data.decisionRegistry || []).find(d => d.id === decisionId);
  if (!decision) return null;
  
  if (!decision.linkedWorkflow.includes(workflowId)) {
    decision.linkedWorkflow.push(workflowId);
  }
  
  return decision;
}

// Summary for dashboard
function getDecisionSummary(data) {
  const registry = data.decisionRegistry || [];
  
  return {
    totalDecisions: registry.length,
    activeDecisions: registry.filter(d => d.status === 'approved' || d.status === 'in_progress').length,
    completedThisWeek: registry.filter(d => {
      if (!d.completedAt) return false;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(d.completedAt).getTime() > weekAgo;
    }).length,
    totalExpectedValue: registry.reduce((s, d) => s + (d.expectedValue || 0), 0),
    totalActualValue: registry.reduce((s, d) => s + (d.actualValue || 0), 0),
    topRisky: registry.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical').slice(0, 5),
    recent: registry.slice(0, 10)
  };
}

module.exports = {
  recordDecision,
  getDecisionRegistry,
  updateDecisionStatus,
  getDecisionTimeline,
  linkDecisionToWorkflow,
  getDecisionSummary
};