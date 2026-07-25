// Executive Morning Brief — automatically generated daily business summary

function generateMorningBrief(data) {
  const now = new Date();
  const today = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  
  // Calculate metrics from data
  const activeInvestigations = data.investigations.filter(i => i.status === 'active' || i.status === 'draft');
  const pendingApprovals = data.investigations.filter(i => i.status === 'draft');
  const activeWorkflows = data.workflows.filter(w => w.status === 'in_progress');
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter(t => t.status === 'done' || t.lane === 'Done this week').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Generate alert count
  const alerts = [];
  
  // Check pipeline health
  const pipelineRisk = data.investigations.some(i => 
    i.question && i.question.toLowerCase().includes('pipeline')
  );
  if (pipelineRisk) {
    alerts.push({
      type: 'warning',
      icon: '⚠',
      title: 'Pipeline требует внимания',
      detail: 'EU pipeline на 18% ниже плана. Три агента завершили анализ.',
      action: 'review'
    });
  }

  // Check churn signals
  const churnAccounts = data.customerHealth?.accounts?.filter(a => a.health === 'at_risk') || [];
  if (churnAccounts.length > 0) {
    alerts.push({
      type: 'critical',
      icon: '🚨',
      title: `${churnAccounts.length} аккаунта под риском оттока`,
      detail: churnAccounts.map(a => `${a.name} ($${a.mrr?.toLocaleString() || '0'} MRR)`).join(', '),
      action: 'review'
    });
  }

  // Check active blockers
  const blockers = data.tasks.filter(t => t.lane === 'Needs decision' || t.lane === 'Требует решения');
  if (blockers.length > 0) {
    alerts.push({
      type: 'warning',
      icon: '⏸',
      title: `${blockers.length} задач${blockers.length > 1 ? 'и' : 'а'} ожидают решения`,
      detail: blockers.map(t => t.title).join(', '),
      action: 'review'
    });
  }

  // Generate wins
  const wins = [];
  if (completionRate > 60) {
    wins.push({
      icon: '✓',
      title: `${completionRate}% задач выполнено`,
      detail: `${completedTasks} из ${totalTasks} задач закрыты на этой неделе.`
    });
  }

  const brief = {
    id: `brief_${Date.now()}`,
    date: now.toISOString(),
    title: `Доброе утро, Сам. Ваш бизнес в движении.`,
    greeting: `Сегодня ${today}`,
    metrics: {
      pipeline: '$842K MRR',
      pipelineTrend: pipelineRisk ? 'down' : 'stable',
      activeWorkflows: activeWorkflows.length,
      completionRate: `${completionRate}%`,
      teamVelocity: `${completedTasks} задач завершено`,
      alertsCount: alerts.length,
      winsCount: wins.length
    },
    alerts,
    wins,
    topRecommendations: [
      {
        priority: 'high',
        title: 'Утвердить план восстановления EU pipeline',
        reason: 'Три агента завершили анализ. Потенциальное влияние: $42-71k в квартале.',
        action: 'approve',
        actionUrl: '/api/investigations/pending'
      },
      {
        priority: 'medium',
        title: 'Проверить онбординг enterprise-клиентов',
        reason: 'Клиентский агент обнаружил задержки у 3 аккаунтов. Риск оттока $19k.',
        action: 'review',
        actionUrl: '/api/customer-health'
      },
      {
        priority: 'low',
        title: 'Перераспределить $8k маркетингового бюджета',
        reason: 'Q3 эксперимент завершён. Маркетинг-агент рекомендует релокацию в performance.',
        action: 'review',
        actionUrl: '/api/roi'
      }
    ],
    agentActivity: data.agents?.filter(a => a.state === 'active').map(a => ({
      name: a.name,
      task: a.task,
      letter: a.letter || a.id[0].toUpperCase()
    })) || [],
    aiSummary: generateAISummary(data, alerts, wins)
  };

  return brief;
}

function generateAISummary(data, alerts, wins) {
  const parts = [];
  
  if (alerts.length > 0) {
    parts.push(`Обнаружено ${alerts.length} ${alerts.length === 1 ? 'сигнал' : 'сигнала'}, требующих внимания.`);
  }
  
  const activeCount = data.agents?.filter(a => a.state === 'active').length || 0;
  if (activeCount > 0) {
    parts.push(`${activeCount} ИИ-агентов активно работают над задачами компании.`);
  }

  const workflowCount = data.workflows?.filter(w => w.status === 'in_progress').length || 0;
  if (workflowCount > 0) {
    parts.push(`${workflowCount} процесс${workflowCount > 1 ? 'а' : ''} восстановления в исполнении.`);
  }

  if (wins.length > 0) {
    parts.push(wins.map(w => w.title).join('. ') + '.');
  }

  parts.push('Система здорова, 14 источников синхронизировано.');

  return parts.join(' ');
}

function getBriefHistory(data) {
  if (!data.morningBriefs) data.morningBriefs = [];
  return data.morningBriefs;
}

function saveBrief(data, brief) {
  if (!data.morningBriefs) data.morningBriefs = [];
  data.morningBriefs.unshift(brief);
  // Keep last 30 briefs
  if (data.morningBriefs.length > 30) data.morningBriefs = data.morningBriefs.slice(0, 30);
  return brief;
}

module.exports = {
  generateMorningBrief,
  saveBrief,
  getBriefHistory
};