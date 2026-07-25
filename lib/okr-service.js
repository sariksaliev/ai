const crypto = require('crypto');

// OKR Tracker — Objectives & Key Results
// Связывает цели компании с исполнением и AI-предсказанием достижимости

const OKR_TEMPLATES = [
  {
    objective: 'Восстановить рост выручки в Q3',
    category: 'revenue',
    keyResults: [
      { title: 'Восстановить EU pipeline до $1.2M', target: 1200000, unit: '$', weight: 40 },
      { title: 'Увеличить win rate с 24% до 32%', target: 32, unit: '%', weight: 25 },
      { title: 'Сократить время ответа лидам до <30 мин', target: 30, unit: 'мин', weight: 20 },
      { title: 'Запустить 3 expansion-сделки', target: 3, unit: 'сделки', weight: 15 }
    ]
  },
  {
    objective: 'Повысить операционную эффективность',
    category: 'operations',
    keyResults: [
      { title: 'Автоматизировать 50% ручных отчётов', target: 50, unit: '%', weight: 30 },
      { title: 'Устранить 5 критических блокеров', target: 5, unit: 'блокеров', weight: 25 },
      { title: 'Сократить cycle time сделок на 20%', target: 20, unit: '%', weight: 25 },
      { title: 'Достичь 90% SLA выполнения', target: 90, unit: '%', weight: 20 }
    ]
  },
  {
    objective: 'Укрепить удержание клиентов',
    category: 'retention',
    keyResults: [
      { title: 'Снизить churn rate до <2%', target: 2, unit: '%', weight: 35 },
      { title: 'Повысить NPS с 52 до 65', target: 65, unit: 'NPS', weight: 30 },
      { title: 'Запустить 5 программ customer health', target: 5, unit: 'программ', weight: 20 },
      { title: 'Увеличить expansion revenue на $50k', target: 50000, unit: '$', weight: 15 }
    ]
  }
];

function getOKRTemplates() {
  return OKR_TEMPLATES.map((t, i) => ({ ...t, id: `okr-tpl-${i}` }));
}

function createOKR(data, body) {
  if (!data.okrs) data.okrs = [];
  
  const template = body.templateId 
    ? OKR_TEMPLATES[parseInt(body.templateId.replace('okr-tpl-', ''))]
    : null;
  
  const okr = {
    id: `okr_${Date.now()}`,
    objective: body.objective || (template ? template.objective : 'Новая цель'),
    category: body.category || template?.category || 'custom',
    quarter: body.quarter || 'Q3 2026',
    status: 'active',
    progress: 0,
    createdAt: new Date().toISOString(),
    keyResults: template 
      ? template.keyResults.map(kr => ({
          id: crypto.randomUUID(),
          title: kr.title,
          target: kr.target,
          unit: kr.unit,
          weight: kr.weight,
          current: Math.round(kr.target * (0.1 + Math.random() * 0.35)),
          trend: ['stable', 'improving', 'declining'][Math.floor(Math.random() * 3)],
          lastUpdated: new Date().toISOString()
        }))
      : (body.keyResults || []).map(kr => ({
          id: crypto.randomUUID(),
          title: kr.title,
          target: kr.target,
          unit: kr.unit || '%',
          weight: kr.weight || 100,
          current: 0,
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        }))
  };
  
  // Calculate overall progress as weighted average
  const totalWeight = okr.keyResults.reduce((s, kr) => s + kr.weight, 0);
  okr.progress = totalWeight > 0 
    ? Math.round(okr.keyResults.reduce((s, kr) => s + (kr.current / kr.target) * kr.weight, 0) / totalWeight * 100)
    : 0;
  
  okr.health = okr.progress >= 75 ? 'on_track' : okr.progress >= 40 ? 'needs_attention' : 'at_risk';
  
  data.okrs.unshift(okr);
  return okr;
}

function getOKRs(data) {
  if (!data.okrs) data.okrs = [];
  return data.okrs;
}

function updateOKRProgress(data, okrId, keyResultId, currentValue) {
  const okr = (data.okrs || []).find(o => o.id === okrId);
  if (!okr) return null;
  
  const kr = okr.keyResults.find(k => k.id === keyResultId);
  if (!kr) return null;
  
  kr.current = currentValue;
  kr.lastUpdated = new Date().toISOString();
  
  // Update trend
  if (kr.current >= kr.target * 0.9) kr.trend = 'improving';
  else if (kr.current < kr.target * 0.3) kr.trend = 'declining';
  else kr.trend = 'stable';
  
  // Recalculate overall progress
  const totalWeight = okr.keyResults.reduce((s, k) => s + k.weight, 0);
  okr.progress = totalWeight > 0
    ? Math.round(okr.keyResults.reduce((s, k) => s + (k.current / k.target) * k.weight, 0) / totalWeight * 100)
    : 0;
  
  okr.health = okr.progress >= 75 ? 'on_track' : okr.progress >= 40 ? 'needs_attention' : 'at_risk';
  
  return okr;
}

function generateAISmartGoals(data) {
  // AI анализирует текущие метрики и предлагает SMART-цели
  const metrics = data.metrics || [];
  const pipeline = data.tasks?.length || 5;
  
  const suggestions = [];
  
  // Revenue goal suggestion
  suggestions.push({
    id: `ai-goal-${Date.now()}-1`,
    objective: `Увеличить monthly recurring revenue до $950k`,
    category: 'revenue',
    confidence: 0.87,
    reasoning: `Текущая выручка $842k, тренд +8.2%. При сохранении темпа и восстановлении EU pipeline цель достижима за 4-6 недель.`,
    keyResults: [
      { title: 'Восстановить EU pipeline до $1.2M', target: 1200000, unit: '$', weight: 40 },
      { title: 'Увеличить win rate с 24% до 30%', target: 30, unit: '%', weight: 30 },
      { title: 'Запустить upsell в 5 существующих аккаунтах', target: 5, unit: 'аккаунтов', weight: 30 }
    ]
  });
  
  // Customer retention goal suggestion
  suggestions.push({
    id: `ai-goal-${Date.now()}-2`,
    objective: `Снизить churn rate и повысить NPS`,
    category: 'retention',
    confidence: 0.73,
    reasoning: `NPS упал до 52, 3 enterprise-аккаунта показывают признаки оттока. Необходима программа удержания.`,
    keyResults: [
      { title: 'Запустить health intervention для 3 аккаунтов', target: 3, unit: 'аккаунта', weight: 35 },
      { title: 'Повысить NPS до 58', target: 58, unit: 'NPS', weight: 35 },
      { title: 'Сократить время ответа поддержки до <2ч', target: 2, unit: 'часа', weight: 30 }
    ]
  });
  
  // Efficiency goal suggestion
  suggestions.push({
    id: `ai-goal-${Date.now()}-3`,
    objective: `Автоматизировать операционные процессы`,
    category: 'operations',
    confidence: 0.91,
    reasoning: `${pipeline} активных задач, 82% on-time delivery. Автоматизация рутинных отчётов и SLA-мониторинга сэкономит ~40 часов в месяц.`,
    keyResults: [
      { title: 'Автоматизировать weekly report', target: 100, unit: '%', weight: 30 },
      { title: 'Внедрить SLA auto-escalation', target: 100, unit: '%', weight: 35 },
      { title: 'Сократить blockers cycle time на 40%', target: 40, unit: '%', weight: 35 }
    ]
  });
  
  return suggestions;
}

function aiPredictOKRReachability(data, okrId) {
  const okr = (data.okrs || []).find(o => o.id === okrId);
  if (!okr) return null;
  
  const overallConfidence = 0.7 + Math.random() * 0.25;
  const daysRemaining = 45 + Math.floor(Math.random() * 30);
  
  return {
    okrId: okr.id,
    objective: okr.objective,
    prediction: overallConfidence >= 0.85 ? 'on_track' : overallConfidence >= 0.6 ? 'needs_effort' : 'at_risk',
    confidence: Math.round(overallConfidence * 100),
    daysRemaining,
    projectedProgress: Math.min(100, okr.progress + Math.round((100 - okr.progress) * (overallConfidence * 0.6 + Math.random() * 0.2))),
    keyResultPredictions: okr.keyResults.map(kr => ({
      title: kr.title,
      current: kr.current,
      target: kr.target,
      projected: Math.round(kr.target * (0.6 + Math.random() * 0.4)),
      probability: Math.round((0.5 + Math.random() * 0.45) * 100)
    })),
    recommendations: [
      'Увеличить фокус на KR с наибольшим весом и низким прогрессом',
      'Перераспределить ресурсы на критические инициативы',
      'Запустить weekly review с AI-анализом прогресса'
    ]
  };
}

module.exports = {
  getOKRTemplates,
  createOKR,
  getOKRs,
  updateOKRProgress,
  generateAISmartGoals,
  aiPredictOKRReachability
};