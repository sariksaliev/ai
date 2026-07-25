// AI-generated executive reports with export capability

const crypto = require('crypto');

function generateReport(data, type, context) {
  const report = {
    id: `report_${Date.now()}`,
    type,
    title: getReportTitle(type),
    generatedAt: new Date().toISOString(),
    generatedBy: 'Axiom AI',
    sections: [],
    summary: '',
    metrics: {}
  };

  switch (type) {
    case 'executive':
      generateExecutiveReport(report, data);
      break;
    case 'pipeline':
      generatePipelineReport(report, data);
      break;
    case 'churn':
      generateChurnReport(report, data);
      break;
    case 'financial':
      generateFinancialReport(report, data);
      break;
    case 'operations':
      generateOperationsReport(report, data);
      break;
    default:
      generateExecutiveReport(report, data);
  }

  // Save to data
  if (!data.reports) data.reports = [];
  data.reports.unshift(report);
  if (data.reports.length > 50) data.reports = data.reports.slice(0, 50);

  return report;
}

function getReportTitle(type) {
  const titles = {
    executive: 'Еженедельный executive-дайджест Axiom',
    pipeline: 'Отчёт о состоянии pipeline и воронки продаж',
    churn: 'Анализ рисков оттока и здоровья клиентов',
    financial: 'Финансовый обзор: runway, burn rate, маржинальность',
    operations: 'Операционная эффективность и bottlenecks'
  };
  return titles[type] || titles.executive;
}

function generateExecutiveReport(report, data) {
  const activeInvestigations = data.investigations?.filter(i => i.status === 'active' || i.status === 'draft').length || 0;
  const pendingApprovals = data.investigations?.filter(i => i.status === 'draft').length || 0;
  const activeWorkflows = data.workflows?.filter(w => w.status === 'in_progress').length || 0;
  const completedTasks = data.tasks?.filter(t => t.status === 'done' || t.lane === 'Done this week').length || 0;
  const totalTasks = data.tasks?.length || 0;

  report.summary = `Axiom OS сгенерировал отчёт на основе анализа ${activeInvestigations} расследований, ${activeWorkflows} активных процессов и ${totalTasks} задач. Общий health score системы: ${calculateOverallHealth(data)}%.`;

  report.metrics = {
    activeInvestigations,
    pendingApprovals,
    activeWorkflows,
    taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    activeAgents: data.agents?.filter(a => a.state === 'active').length || 0,
    connectedIntegrations: data.integrations?.filter(i => i.status === 'connected').length || 0
  };

  report.sections = [
    {
      title: 'Исполнительное резюме',
      content: `За отчётный период Axiom обработал ${activeInvestigations} бизнес-запросов, запустил ${activeWorkflows} процессов восстановления. Система автоматически выявила риски на общую сумму $42-71k и предоставила рекомендации по их митигации.`,
      priority: 'high'
    },
    {
      title: 'Ключевые метрики',
      content: `MRR: $842K | Pipeline: $4.2M | ARR: $10.1M | Churn Rate: 6.2% | NPS: 52 | Runway: 18.4 мес.`,
      priority: 'high'
    },
    {
      title: 'Активные инициативы',
      content: (data.businessMemory?.ongoingInitiatives || []).map(i => 
        `• ${i.title} (${i.owner}) — ${i.progress}% выполнения, статус: ${i.status === 'on_track' ? 'в плане' : 'под риском'}`
      ).join('\n') || 'Нет активных инициатив',
      priority: 'medium'
    },
    {
      title: 'Рекомендации системы',
      content: '1. Утвердить план восстановления EU pipeline (high priority)\n2. Запустить программу спасения для 3 enterprise-аккаунтов\n3. Перераспределить $8k маркетингового бюджета',
      priority: 'medium'
    }
  ];
}

function generatePipelineReport(report, data) {
  report.summary = 'Детальный анализ pipeline: текущее состояние, прогнозы и рекомендации по восстановлению.';
  report.metrics = {
    totalDeals: 312,
    pipelineValue: '$4.2M',
    winRate: '22%',
    avgDealSize: '$13,500',
    salesCycleLength: '45 дней',
    stalledDeals: 17
  };
  report.sections = [
    { title: 'Обзор pipeline', content: 'Текущий pipeline составляет $4.2M при цели Q3 $5.8M. Разрыв $1.6M требует активных действий.', priority: 'high' },
    { title: 'Узкие места', content: '17 сделок застряли на стадии negotiation. Среднее время ответа лидам выросло до 6.1 часов.', priority: 'high' },
    { title: 'Прогноз', content: 'При текущем тренде: ожидаемое закрытие $3.1M. С рекомендуемыми изменениями: до $4.8M.', priority: 'medium' }
  ];
}

function generateChurnReport(report, data) {
  const atRiskAccounts = data.customerHealth?.accounts?.filter(a => a.health === 'at_risk') || [];
  report.summary = `Обнаружено ${atRiskAccounts.length} аккаунта под риском оттока. Общий годовой риск: $19k.`;
  report.metrics = {
    totalAccounts: data.customerHealth?.accounts?.length || 12,
    healthyAccounts: data.customerHealth?.summary?.healthy || 7,
    warningAccounts: data.customerHealth?.summary?.warning || 2,
    atRiskAccounts: atRiskAccounts.length,
    churnRate: '6.2%',
    nps: 52
  };
  report.sections = [
    { title: 'Аккаунты под риском', content: atRiskAccounts.map(a => `• ${a.name}: $${a.mrr?.toLocaleString()} MRR, usage ${a.usage}%, NPS ${a.nps}`).join('\n') || 'Нет аккаунтов под риском', priority: 'high' },
    { title: 'Рекомендации', content: '1. Немедленная интервенция для 3 аккаунтов\n2. Персональный онбординг для enterprise\n3. Еженедельный мониторинг health score', priority: 'high' }
  ];
}

function generateFinancialReport(report, data) {
  report.summary = 'Финансовый обзор: компания сохраняет здоровый runway с потенциалом оптимизации.';
  report.metrics = {
    mrr: '$842K',
    arr: '$10.1M',
    grossMargin: '72%',
    burnRate: '$142K/мес',
    runway: '18.4 мес',
    atRiskRevenue: '$42-71K'
  };
  report.sections = [
    { title: 'Выручка', content: 'Текущий MRR $842K. При успешном восстановлении pipeline прогноз на Q3: $912K MRR.', priority: 'high' },
    { title: 'Расходы', content: 'Burn rate $142K/мес. Runway 18.4 месяца. Потенциал оптимизации: $8-12K/мес.', priority: 'medium' },
    { title: 'Риски', content: '$42-71K выручки под риском в Q3. Каждый день задержки восстановления стоит ~$3.4K.', priority: 'high' }
  ];
}

function generateOperationsReport(report, data) {
  report.summary = 'Операционная эффективность: 82% задач выполняется в срок. Обнаружены bottlenecks.';
  report.metrics = {
    tasksCompleted: data.tasks?.filter(t => t.status === 'done').length || 0,
    tasksPending: data.tasks?.filter(t => t.lane === 'Needs decision' || t.lane === 'Требует решения').length || 0,
    onTimeDelivery: '82%',
    activeWorkflows: data.workflows?.filter(w => w.status === 'in_progress').length || 0,
    blockers: 1
  };
  report.sections = [
    { title: 'Исполнение', content: `${report.metrics.tasksCompleted} задач завершено. ${report.metrics.onTimeDelivery} выполняется в срок.`, priority: 'high' },
    { title: 'Блокеры', content: 'Запуск продукта заблокирован security review. Владелец уведомлён. Ожидание: 4 дня.', priority: 'high' },
    { title: 'Рекомендации', content: '1. Разблокировать security review\n2. Автоматизировать SLA-мониторинг\n3. Еженедельный operational review', priority: 'medium' }
  ];
}

function calculateOverallHealth(data) {
  const factors = [];
  
  // Task completion
  const tasks = data.tasks?.length || 0;
  const done = data.tasks?.filter(t => t.status === 'done').length || 0;
  if (tasks > 0) factors.push(Math.round((done / tasks) * 100));
  
  // Workflows
  const workflows = data.workflows?.length || 0;
  const completedWf = data.workflows?.filter(w => w.status === 'done').length || 0;
  if (workflows > 0) factors.push(Math.round((completedWf / workflows) * 100));
  
  // Customer health
  const accounts = data.customerHealth?.accounts?.length || 0;
  const healthy = data.customerHealth?.summary?.healthy || 0;
  if (accounts > 0) factors.push(Math.round((healthy / accounts) * 100));
  
  if (factors.length === 0) return 85;
  return Math.round(factors.reduce((s, v) => s + v, 0) / factors.length);
}

function getReportHistory(data) {
  return data.reports || [];
}

function exportReport(report, format) {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }
  // Text format
  let text = `=== ${report.title} ===\n`;
  text += `Дата: ${new Date(report.generatedAt).toLocaleString()}\n`;
  text += `Тип: ${report.type}\n\n`;
  text += `Сводка: ${report.summary}\n\n`;
  
  Object.entries(report.metrics).forEach(([key, value]) => {
    text += `${key}: ${value}\n`;
  });
  
  text += '\n';
  report.sections.forEach(section => {
    text += `[${section.priority.toUpperCase()}] ${section.title}\n`;
    text += `${section.content}\n\n`;
  });
  
  return text;
}

module.exports = {
  generateReport,
  getReportHistory,
  exportReport
};