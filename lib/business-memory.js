// Business Memory — persistent company knowledge store
// Stores goals, approvals, strategies, decisions, initiatives

const crypto = require('crypto');

function createBusinessMemory(data) {
  if (!data.businessMemory) {
    data.businessMemory = {
      goals: [
        { id: 'goal_1', title: 'Достичь $1.2M ARR к концу Q3', category: 'revenue', progress: 68, createdAt: '2026-01-15T08:00:00Z', status: 'active' },
        { id: 'goal_2', title: 'Снизить отток клиентов до <5%', category: 'retention', progress: 42, createdAt: '2026-01-15T08:00:00Z', status: 'active' },
        { id: 'goal_3', title: 'Запустить EU expansion', category: 'growth', progress: 55, createdAt: '2026-03-01T08:00:00Z', status: 'active' },
        { id: 'goal_4', title: 'Достичь NPS > 60', category: 'satisfaction', progress: 71, createdAt: '2026-01-15T08:00:00Z', status: 'active' }
      ],
      previousApprovals: [
        { id: 'apr_1', investigationId: 'inv_1', plan: 'EU Pipeline Recovery', approvedAt: '2026-07-20T14:30:00Z', approvedBy: 'Sam Azizov', status: 'executing' },
        { id: 'apr_2', investigationId: 'inv_2', plan: 'Q3 Budget Reallocation', approvedAt: '2026-07-18T10:00:00Z', approvedBy: 'Sam Azizov', status: 'completed' }
      ],
      preferredStrategies: [
        { id: 'str_1', name: 'Account-Based Marketing', effectiveness: 87, usedCount: 12, lastUsed: '2026-07-15T00:00:00Z' },
        { id: 'str_2', name: 'Content-Led Growth', effectiveness: 76, usedCount: 8, lastUsed: '2026-07-10T00:00:00Z' },
        { id: 'str_3', name: 'Expansion Revenue', effectiveness: 92, usedCount: 5, lastUsed: '2026-07-22T00:00:00Z' }
      ],
      historicalDecisions: [
        { id: 'dec_1', title: 'Перераспределение $8k из бренда в performance', outcome: 'positive', impact: '+21% SQL', date: '2026-07-18T00:00:00Z' },
        { id: 'dec_2', title: 'Запуск EU ретаргетинга', outcome: 'pending', impact: 'Ожидание результатов', date: '2026-07-22T00:00:00Z' }
      ],
      ongoingInitiatives: [
        { id: 'init_1', title: 'EU Pipeline Recovery', owner: 'Cross-functional', deadline: '2026-08-12T00:00:00Z', progress: 33, status: 'on_track' },
        { id: 'init_2', title: 'Enterprise Onboarding Redesign', owner: 'Customer Agent', deadline: '2026-08-01T00:00:00Z', progress: 70, status: 'at_risk' },
        { id: 'init_3', title: 'Q3 Campaign Optimization', owner: 'Marketing Agent', deadline: '2026-07-30T00:00:00Z', progress: 85, status: 'on_track' }
      ]
    };
  }
  return data.businessMemory;
}

function getBusinessMemory(data) {
  if (!data.businessMemory) createBusinessMemory(data);
  return data.businessMemory;
}

function addGoal(data, goal) {
  const memory = getBusinessMemory(data);
  const newGoal = { id: `goal_${Date.now()}`, ...goal, createdAt: new Date().toISOString(), status: 'active' };
  memory.goals.push(newGoal);
  return newGoal;
}

function addApproval(data, investigationId, plan, approvedBy) {
  const memory = getBusinessMemory(data);
  const approval = {
    id: `apr_${Date.now()}`,
    investigationId,
    plan,
    approvedAt: new Date().toISOString(),
    approvedBy,
    status: 'executing'
  };
  memory.previousApprovals.push(approval);
  return approval;
}

function addDecision(data, title, outcome, impact) {
  const memory = getBusinessMemory(data);
  const decision = {
    id: `dec_${Date.now()}`,
    title,
    outcome,
    impact,
    date: new Date().toISOString()
  };
  memory.historicalDecisions.push(decision);
  return decision;
}

function addInitiative(data, initiative) {
  const memory = getBusinessMemory(data);
  const newInit = { id: `init_${Date.now()}`, ...initiative, progress: 0, status: 'on_track' };
  memory.ongoingInitiatives.push(newInit);
  return newInit;
}

function updateInitiative(data, id, updates) {
  const memory = getBusinessMemory(data);
  const init = memory.ongoingInitiatives.find(i => i.id === id);
  if (!init) return null;
  Object.assign(init, updates);
  return init;
}

function getRelevantMemory(data, context) {
  const memory = getBusinessMemory(data);
  // Return memory items relevant to a given context/question
  const keywords = context.toLowerCase().split(' ');
  const relevant = {
    goals: memory.goals.filter(g => g.status === 'active'),
    recentApprovals: memory.previousApprovals.slice(-3),
    effectiveStrategies: memory.preferredStrategies.filter(s => s.effectiveness > 70),
    relevantDecisions: memory.historicalDecisions.filter(d => 
      keywords.some(k => d.title.toLowerCase().includes(k))
    ),
    activeInitiatives: memory.ongoingInitiatives.filter(i => i.status !== 'completed')
  };
  return relevant;
}

module.exports = {
  createBusinessMemory,
  getBusinessMemory,
  addGoal,
  addApproval,
  addDecision,
  addInitiative,
  updateInitiative,
  getRelevantMemory
};