const crypto = require('crypto');

// SLA Dashboard — отслеживание Service Level Agreements
// Каждое SLA: метрика, target, current, статус, эскалации

function generateSLADashboard(data) {
  const slas = [
    {
      id: 'sla-1',
      name: 'Время ответа лидам',
      description: 'Медианное время первого ответа на входящий лид',
      metric: 'Время ответа',
      target: 30,
      unit: 'мин',
      current: 24,
      status: current => current <= 30 ? 'met' : current <= 60 ? 'warning' : 'breached',
      trend: 'improving',
      owner: 'Sales Agent',
      escalationContact: 'CRO',
      lastChecked: new Date().toISOString()
    },
    {
      id: 'sla-2',
      name: 'Pipeline coverage',
      description: 'Отношение pipeline к плану продаж',
      metric: 'Pipeline coverage',
      target: 3.0,
      unit: 'x',
      current: 2.7,
      status: current => current >= 3.0 ? 'met' : current >= 2.5 ? 'warning' : 'breached',
      trend: 'declining',
      owner: 'Marketing Agent',
      escalationContact: 'CMO',
      lastChecked: new Date().toISOString()
    },
    {
      id: 'sla-3',
      name: 'Время закрытия сделки',
      description: 'Среднее время от создания opportunity до закрытия',
      metric: 'Cycle time',
      target: 30,
      unit: 'дней',
      current: 34,
      status: current => current <= 30 ? 'met' : current <= 45 ? 'warning' : 'breached',
      trend: 'declining',
      owner: 'Sales Agent',
      escalationContact: 'CRO',
      lastChecked: new Date().toISOString()
    },
    {
      id: 'sla-4',
      name: 'NPS Score',
      description: 'Net Promoter Score среди active customers',
      metric: 'NPS',
      target: 60,
      unit: 'NPS',
      current: 52,
      status: current => current >= 60 ? 'met' : current >= 40 ? 'warning' : 'breached',
      trend: 'declining',
      owner: 'Customer Agent',
      escalationContact: 'CEO',
      lastChecked: new Date().toISOString()
    },
    {
      id: 'sla-5',
      name: 'Churn Rate',
      description: 'Ежемесячный отток клиентов',
      metric: 'Churn',
      target: 2.0,
      unit: '%',
      current: 3.2,
      status: current => current <= 2.0 ? 'met' : current <= 3.5 ? 'warning' : 'breached',
      trend: 'declining',
      owner: 'Customer Agent',
      escalationContact: 'CEO',
      lastChecked: new Date().toISOString()
    },
    {
      id: 'sla-6',
      name: 'On-time delivery',
      description: 'Процент задач и обязательств, выполненных в срок',
      metric: 'Delivery',
      target: 90,
      unit: '%',
      current: 82,
      status: current => current >= 90 ? 'met' : current >= 80 ? 'warning' : 'breached',
      trend: 'stable',
      owner: 'Operations Agent',
      escalationContact: 'CEO',
      lastChecked: new Date().toISOString()
    },
    {
      id: 'sla-7',
      name: 'Время реакции поддержки',
      description: 'Медианное время первого ответа support team',
      metric: 'Support response',
      target: 120,
      unit: 'мин',
      current: 45,
      status: current => current <= 120 ? 'met' : current <= 240 ? 'warning' : 'breached',
      trend: 'improving',
      owner: 'Customer Agent',
      escalationContact: 'Support Lead',
      lastChecked: new Date().toISOString()
    },
    {
      id: 'sla-8',
      name: 'Время разрешения блокеров',
      description: 'Среднее время устранения критических блокеров',
      metric: 'Blocker resolution',
      target: 24,
      unit: 'ч',
      current: 48,
      status: current => current <= 24 ? 'met' : current <= 48 ? 'warning' : 'breached',
      trend: 'declining',
      owner: 'Operations Agent',
      escalationContact: 'CTO',
      lastChecked: new Date().toISOString()
    }
  ];
  
  // Calculate status for each SLA
  const enriched = slas.map(sla => ({
    ...sla,
    status: sla.status(sla.current),
    progress: sla.current !== 0 ? Math.round((sla.current / sla.target) * 100) : 0
  }));
  
  const stats = {
    total: enriched.length,
    met: enriched.filter(s => s.status === 'met').length,
    warning: enriched.filter(s => s.status === 'warning').length,
    breached: enriched.filter(s => s.status === 'breached').length,
    overall: calculateOverallHealth(enriched)
  };
  
  // Generate alerts for breached/warning SLAs
  const alerts = enriched
    .filter(s => s.status !== 'met')
    .map(s => ({
      slaId: s.id,
      name: s.name,
      status: s.status,
      detail: `${s.name}: ${s.current}${s.unit} (target: ${s.target}${s.unit})`,
      severity: s.status === 'breached' ? 'critical' : 'warning',
      owner: s.owner,
      escalationContact: s.escalationContact
    }));
  
  // Generate weekly history for chart
  const history = enriched.map(sla => ({
    name: sla.name,
    data: generateHistory(sla)
  }));
  
  return {
    slas: enriched,
    stats,
    alerts,
    history,
    summary: generateSummary(stats, alerts)
  };
}

function calculateOverallHealth(slas) {
  const met = slas.filter(s => s.status === 'met').length;
  const total = slas.length;
  const ratio = met / total;
  if (ratio >= 0.8) return 'healthy';
  if (ratio >= 0.5) return 'at_risk';
  return 'critical';
}

function generateHistory(sla) {
  const points = 7;
  const data = [];
  let value = sla.current;
  for (let i = points; i >= 0; i--) {
    value = Math.max(1, value + (Math.random() - 0.5) * sla.target * 0.15);
    data.push({
      day: i === 0 ? 'Сегодня' : `-${i}д`,
      value: Math.round(value * 10) / 10
    });
  }
  return data;
}

function generateSummary(stats, alerts) {
  return {
    text: stats.overall === 'healthy' 
      ? 'Все SLA в норме' 
      : stats.overall === 'at_risk'
        ? `${stats.warning + stats.breached} SLA требуют внимания`
        : `${stats.breached} SLA нарушены — требуется немедленное вмешательство`,
    health: stats.overall,
    actionItems: alerts.slice(0, 3).map(a => ({
      title: a.name,
      action: a.status === 'breached' ? 'Немедленная эскалация' : 'Мониторинг',
      owner: a.owner
    }))
  };
}

// Track SLA violations for audit
function trackSLAViolation(data, slaId, detail) {
  if (!data.slaViolations) data.slaViolations = [];
  data.slaViolations.push({
    id: `sla-violation-${Date.now()}`,
    slaId,
    detail,
    timestamp: new Date().toISOString(),
    acknowledged: false
  });
  return data.slaViolations;
}

function getSLAViolations(data) {
  return data.slaViolations || [];
}

module.exports = {
  generateSLADashboard,
  trackSLAViolation,
  getSLAViolations
};