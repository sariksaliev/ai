// Audit Service — comprehensive action logging with query, filter, and pagination

const crypto = require('crypto');

function recordAudit(data, entry) {
  if (!data.audit) data.audit = [];
  const auditEntry = {
    id: `audit_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
    at: new Date().toISOString(),
    actor: {
      id: entry.actor?.id || 'system',
      name: entry.actor?.name || 'Axiom System',
      role: entry.actor?.role || 'system'
    },
    action: entry.action || 'unknown',
    resource: entry.resource || 'unknown',
    detail: entry.detail || '',
    category: categorizeAction(entry.action),
    severity: determineSeverity(entry.action)
  };
  data.audit.unshift(auditEntry);
  // Keep last 1000 entries
  if (data.audit.length > 1000) data.audit = data.audit.slice(0, 1000);
  return auditEntry;
}

function queryAudit(data, filters = {}) {
  let results = data.audit || [];
  
  if (filters.action) {
    results = results.filter(e => e.action.includes(filters.action));
  }
  if (filters.actor) {
    results = results.filter(e => e.actor.name.toLowerCase().includes(filters.actor.toLowerCase()));
  }
  if (filters.category) {
    results = results.filter(e => e.category === filters.category);
  }
  if (filters.severity) {
    results = results.filter(e => e.severity === filters.severity);
  }
  if (filters.since) {
    const since = new Date(filters.since);
    results = results.filter(e => new Date(e.at) >= since);
  }
  if (filters.until) {
    const until = new Date(filters.until);
    results = results.filter(e => new Date(e.at) <= until);
  }
  
  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);
  
  return {
    entries: paginated,
    total: results.length,
    page,
    limit,
    totalPages: Math.ceil(results.length / limit)
  };
}

function getAuditSummary(data) {
  const audit = data.audit || [];
  const summary = {
    total: audit.length,
    byCategory: {},
    bySeverity: {},
    recentActivity: audit.slice(0, 5),
    topActors: [],
    last24h: 0
  };
  
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  
  audit.forEach(entry => {
    summary.byCategory[entry.category] = (summary.byCategory[entry.category] || 0) + 1;
    summary.bySeverity[entry.severity] = (summary.bySeverity[entry.severity] || 0) + 1;
    if (new Date(entry.at).getTime() > last24h) summary.last24h++;
  });
  
  // Top actors
  const actorCounts = {};
  audit.forEach(e => {
    actorCounts[e.actor.name] = (actorCounts[e.actor.name] || 0) + 1;
  });
  summary.topActors = Object.entries(actorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  
  return summary;
}

function categorizeAction(action) {
  if (action.startsWith('auth.')) return 'authentication';
  if (action.startsWith('agent.')) return 'agent';
  if (action.startsWith('workflow.')) return 'workflow';
  if (action.startsWith('task.')) return 'task';
  if (action.startsWith('integration.')) return 'integration';
  if (action.startsWith('slack.')) return 'communication';
  if (action.startsWith('chat.')) return 'chat';
  if (action.startsWith('decision.')) return 'decision';
  if (action.startsWith('report.')) return 'report';
  return 'general';
}

function determineSeverity(action) {
  const highSeverity = ['workflow.escalation', 'slack.alert', 'auth.failed'];
  const mediumSeverity = ['workflow.approve', 'decision.execute', 'integration.connect'];
  
  if (highSeverity.includes(action)) return 'high';
  if (mediumSeverity.includes(action)) return 'medium';
  return 'low';
}

module.exports = { recordAudit, queryAudit, getAuditSummary };