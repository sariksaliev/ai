const crypto = require('crypto');

// Auto Action Items — автоматическое создание задач из чата и решений
// Когда CEO говорит "запусти это" или утверждает план — task создаётся автоматически

function extractActionsFromChat(data, chatMessage) {
  if (!data.autoActions) data.autoActions = [];
  const text = (chatMessage.text || chatMessage.question || '').toLowerCase();
  const actions = [];
  
  // Pattern: "запусти X", "создай Y", "начни Z", "сделай W"
  const actionPatterns = [
    { regex: /запусти\s+(.+)/i, priority: 'high' },
    { regex: /создай\s+(.+)/i, priority: 'medium' },
    { regex: /начни\s+(.+)/i, priority: 'high' },
    { regex: /сделай\s+(.+)/i, priority: 'medium' },
    { regex: /подготовь\s+(.+)/i, priority: 'medium' },
    { regex: /организуй\s+(.+)/i, priority: 'low' },
    { regex: /напомни\s+(.+)/i, priority: 'low' }
  ];
  
  for (const pattern of actionPatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const title = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      const action = createAction(data, {
        title: title.length > 100 ? title.slice(0, 100) : title,
        source: 'chat',
        sourceId: chatMessage.id || `chat_${Date.now()}`,
        priority: pattern.priority,
        owner: 'CEO',
        due: 'Сегодня'
      });
      actions.push(action);
    }
  }
  
  // Pattern: approval keywords
  if (text.includes('утвержд') || text.includes('одобр') || text.includes('давай') || text.includes('погнали')) {
    const action = createAction(data, {
      title: 'Запуск утверждённого плана',
      source: 'chat_approval',
      sourceId: chatMessage.id || `chat_${Date.now()}`,
      priority: 'high',
      owner: 'AI Agents',
      due: 'Сегодня'
    });
    actions.push(action);
  }
  
  return actions;
}

function extractActionsFromInvestigation(data, investigation) {
  if (!data.autoActions) data.autoActions = [];
  const actions = [];
  
  if (investigation.plan && Array.isArray(investigation.plan)) {
    investigation.plan.forEach((step, i) => {
      const title = typeof step === 'string' ? step : (step.title || '');
      if (title) {
        actions.push(createAction(data, {
          title: title.length > 100 ? title.slice(0, 100) : title,
          source: 'investigation',
          sourceId: investigation.id,
          priority: i === 0 ? 'high' : 'medium',
          owner: investigation.agents?.[i] || 'AI Agent',
          due: i === 0 ? 'Сегодня' : 'Завтра'
        }));
      }
    });
  }
  
  return actions;
}

function createAction(data, params) {
  if (!data.autoActions) data.autoActions = [];
  
  const action = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: params.title,
    description: params.description || '',
    source: params.source || 'manual',
    sourceId: params.sourceId || null,
    priority: params.priority || 'medium',
    status: 'pending', // pending, approved, in_progress, completed, cancelled
    owner: params.owner || 'Unassigned',
    due: params.due || null,
    domain: params.domain || detectDomain(params.title),
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  
  data.autoActions.unshift(action);
  
  // Also add to tasks if approved
  if (params.autoApprove !== false) {
    data.tasks.unshift({
      id: action.id,
      lane: 'В работе',
      domain: action.domain,
      title: action.title,
      owner: action.owner,
      due: action.due || 'Сегодня',
      status: 'active',
      sourceActionId: action.id
    });
  }
  
  return action;
}

function detectDomain(title) {
  const t = title.toLowerCase();
  if (t.includes('выручк') || t.includes('сделк') || t.includes('продаж') || t.includes('pipeline') || t.includes('воронк')) return 'Выручка';
  if (t.includes('маркет') || t.includes('кампа') || t.includes('реклам') || t.includes('ads')) return 'Маркетинг';
  if (t.includes('финанс') || t.includes('бюджет') || t.includes('cost') || t.includes('runway')) return 'Финансы';
  if (t.includes('клиент') || t.includes('customer') || t.includes('churn') || t.includes('отток')) return 'Клиенты';
  if (t.includes('операц') || t.includes('process') || t.includes('sla') || t.includes('блокер')) return 'Операции';
  return 'Общее';
}

function getAutoActions(data, filters = {}) {
  if (!data.autoActions) data.autoActions = [];
  let actions = [...data.autoActions];
  if (filters.status) actions = actions.filter(a => a.status === filters.status);
  if (filters.source) actions = actions.filter(a => a.source === filters.source);
  return actions;
}

function updateActionStatus(data, actionId, status) {
  const action = (data.autoActions || []).find(a => a.id === actionId);
  if (!action) return null;
  action.status = status;
  if (status === 'completed') action.completedAt = new Date().toISOString();
  return action;
}

function getActionStats(data) {
  const actions = data.autoActions || [];
  return {
    total: actions.length,
    pending: actions.filter(a => a.status === 'pending').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    completed: actions.filter(a => a.status === 'completed').length,
    bySource: {
      chat: actions.filter(a => a.source === 'chat').length,
      investigation: actions.filter(a => a.source === 'investigation').length,
      manual: actions.filter(a => a.source === 'manual').length
    },
    recent: actions.slice(0, 10)
  };
}

module.exports = {
  extractActionsFromChat,
  extractActionsFromInvestigation,
  createAction,
  getAutoActions,
  updateActionStatus,
  getActionStats
};