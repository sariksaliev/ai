const crypto = require('crypto');

// Risk Register — централизованный реестр всех бизнес-рисков
// Каждый риск: severity, probability, impact, mitigation, owner, статус

const RISK_TEMPLATES = [
  {
    title: 'Снижение pipeline может повлиять на Q4',
    description: 'Текущий pipeline $2.7M при плане $3.1M. При сохранении тренда Q4 под угрозой.',
    category: 'revenue',
    severity: 'high',
    probability: 0.7,
    impact: '$400-600k',
    mitigation: 'Ускорить восстановление EU pipeline, запустить programmatic campaigns',
    owner: 'CRO'
  },
  {
    title: '3 enterprise-аккаунта показывают признаки оттока',
    description: 'Снижение использования, падение NPS, негативная тональность в поддержке.',
    category: 'customer',
    severity: 'high',
    probability: 0.6,
    impact: '$180-250k ARR',
    mitigation: 'Запустить health intervention, назначить CSM, провести executive check-in',
    owner: 'Customer Agent'
  },
  {
    title: 'Security review блокирует запуск продукта',
    description: 'Блокер длится 4 дня, задерживает релиз и влияет на новые сделки.',
    category: 'operations',
    severity: 'medium',
    probability: 0.8,
    impact: '2-3 задержанные сделки, $50-80k',
    mitigation: 'Эскалация CTO, выделение ресурсов на review',
    owner: 'Operations Agent'
  }
];

function getRiskTemplates() {
  return RISK_TEMPLATES.map((t, i) => ({ ...t, id: `risk-tpl-${i}` }));
}

function registerRisk(data, body, actor) {
  if (!data.riskRegister) data.riskRegister = [];
  
  const template = body.templateId 
    ? RISK_TEMPLATES[parseInt(body.templateId.replace('risk-tpl-', ''))]
    : null;
  
  const risk = {
    id: `risk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    title: body.title || (template ? template.title : 'Новый риск'),
    description: body.description || template?.description || '',
    category: body.category || template?.category || 'operational',
    severity: body.severity || template?.severity || 'medium',
    probability: body.probability ?? template?.probability ?? 0.5,
    impact: body.impact || template?.impact || 'TBD',
    mitigation: body.mitigation || template?.mitigation || '',
    owner: actor?.name || body.owner || template?.owner || 'Unassigned',
    status: body.status || 'active', // active, monitoring, mitigated, closed
    detectedAt: new Date().toISOString(),
    detectedBy: actor?.name || 'System',
    linkedInvestigation: body.linkedInvestigation || null,
    linkedDecision: body.linkedDecision || null,
    score: 0,
    updates: [],
    closedAt: null,
    tags: body.tags || []
  };
  
  // Calculate risk score
  const probWeights = { low: 0.2, medium: 0.5, high: 0.8, critical: 0.95 };
  const sevWeights = { low: 1, medium: 2, high: 3, critical: 5 };
  risk.score = Math.round((probWeights[risk.severity] || 0.5) * (sevWeights[risk.severity] || 2) * 20);
  
  data.riskRegister.unshift(risk);
  return risk;
}

function getRiskRegister(data, filters = {}) {
  if (!data.riskRegister) data.riskRegister = [];
  let risks = [...data.riskRegister];
  if (filters.status) risks = risks.filter(r => r.status === filters.status);
  if (filters.severity) risks = risks.filter(r => r.severity === filters.severity);
  if (filters.category) risks = risks.filter(r => r.category === filters.category);
  return risks;
}

function updateRiskStatus(data, riskId, status, update) {
  const risk = (data.riskRegister || []).find(r => r.id === riskId);
  if (!risk) return null;
  risk.status = status;
  if (status === 'closed') risk.closedAt = new Date().toISOString();
  if (update?.note) {
    risk.updates.push({
      text: update.note,
      timestamp: new Date().toISOString(),
      author: update.author || 'System'
    });
  }
  return risk;
}

function getRiskSummary(data) {
  const risks = data.riskRegister || [];
  const active = risks.filter(r => r.status === 'active');
  return {
    total: risks.length,
    active: active.length,
    critical: risks.filter(r => r.severity === 'critical').length,
    high: risks.filter(r => r.severity === 'high').length,
    medium: risks.filter(r => r.severity === 'medium').length,
    mitigated: risks.filter(r => r.status === 'mitigated').length,
    closed: risks.filter(r => r.status === 'closed').length,
    byCategory: {
      revenue: risks.filter(r => r.category === 'revenue').length,
      customer: risks.filter(r => r.category === 'customer').length,
      operations: risks.filter(r => r.category === 'operations').length,
      financial: risks.filter(r => r.category === 'financial').length,
      compliance: risks.filter(r => r.category === 'compliance').length
    },
    topRisks: active.sort((a, b) => b.score - a.score).slice(0, 5),
    averageScore: active.length > 0 
      ? Math.round(active.reduce((s, r) => s + r.score, 0) / active.length) 
      : 0
  };
}

// Auto-detect risks from data
function autoDetectRisks(data) {
  const newRisks = [];
  const existing = data.riskRegister || [];
  
  // Check pipeline risk
  const pipelineMetric = data.metrics?.find(m => m.label?.includes('ВОРОНКИ'));
  if (pipelineMetric && pipelineMetric.change?.includes('↘') && !existing.some(r => r.title.includes('pipeline'))) {
    newRisks.push({
      title: 'Снижение покрытия воронки',
      description: `Pipeline coverage упал ${pipelineMetric.change}. Текущее значение: ${pipelineMetric.value}`,
      category: 'revenue',
      severity: 'high',
      probability: 0.65,
      impact: 'Потенциальное снижение выручки на 10-15% в Q3',
      mitigation: 'Перераспределить маркетинговый бюджет, усилить demand generation',
      owner: 'CRO',
      autoDetected: true
    });
  }
  
  // Check active blockers  
  const blockers = data.tasks?.filter(t => t.title?.toLowerCase().includes('блокер')) || [];
  if (blockers.length > 0 && !existing.some(r => r.title.includes('блокер'))) {
    newRisks.push({
      title: `${blockers.length} активных блокеров в исполнении`,
      description: `Обнаружены критические блокеры, влияющие на delivery.`,
      category: 'operations',
      severity: 'medium',
      probability: 0.8,
      impact: 'Задержка проектов на 3-7 дней',
      mitigation: 'Провести эскалацию, назначить ответственных',
      owner: 'Operations Agent',
      autoDetected: true
    });
  }
  
  return newRisks;
}

module.exports = {
  getRiskTemplates,
  registerRisk,
  getRiskRegister,
  updateRiskStatus,
  getRiskSummary,
  autoDetectRisks
};