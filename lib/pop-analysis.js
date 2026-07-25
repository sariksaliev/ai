// Period-over-Period Analysis Service
// Сравнение метрик WoW, MoM, QoQ с визуализацией и трендами

function generatePopAnalysis(data) {
  const metrics = data.metrics || [];
  
  return {
    weekly: {
      label: 'Неделя к неделе',
      periods: ['Прошлая неделя', 'Эта неделя'],
      metrics: generateWeeklyMetrics(data),
      summary: generateWeeklySummary(data)
    },
    monthly: {
      label: 'Месяц к месяцу',
      periods: ['Июнь 2026', 'Июль 2026'],
      metrics: generateMonthlyMetrics(data),
      summary: generateMonthlySummary(data)
    },
    quarterly: {
      label: 'Квартал к кварталу',
      periods: ['Q2 2026', 'Q3 2026'],
      metrics: generateQuarterlyMetrics(data),
      summary: generateQuarterlySummary(data)
    }
  };
}

function generateWeeklyMetrics(data) {
  // Use actual metrics from seed + simulated week-over-week
  const revenueBase = 842120;
  const pipelineBase = 2700000;
  
  return [
    {
      label: 'Выручка',
      current: revenueBase,
      previous: Math.round(revenueBase * 0.94),
      unit: '$',
      change: calculateChange(revenueBase, Math.round(revenueBase * 0.94)),
      trend: getTrend(revenueBase, Math.round(revenueBase * 0.94))
    },
    {
      label: 'Pipeline',
      current: pipelineBase,
      previous: Math.round(pipelineBase * 1.08),
      unit: '$',
      change: calculateChange(pipelineBase, Math.round(pipelineBase * 1.08)),
      trend: getTrend(pipelineBase, Math.round(pipelineBase * 1.08))
    },
    {
      label: 'Win Rate',
      current: 24,
      previous: 22,
      unit: '%',
      change: calculateChange(24, 22),
      trend: getTrend(24, 22)
    },
    {
      label: 'Время ответа',
      current: 6.1,
      previous: 1.3,
      unit: 'ч',
      change: calculateChange(6.1, 1.3),
      trend: getTrend(6.1, 1.3)
    },
    {
      label: 'NPS',
      current: 52,
      previous: 56,
      unit: 'NPS',
      change: calculateChange(52, 56),
      trend: getTrend(52, 56)
    },
    {
      label: 'Churn Rate',
      current: 3.2,
      previous: 2.8,
      unit: '%',
      change: calculateChange(3.2, 2.8),
      trend: getTrend(3.2, 2.8)
    }
  ];
}

function generateMonthlyMetrics(data) {
  return [
    {
      label: 'Выручка',
      current: 842120,
      previous: 778400,
      unit: '$',
      change: calculateChange(842120, 778400),
      trend: getTrend(842120, 778400)
    },
    {
      label: 'Pipeline',
      current: 2700000,
      previous: 3100000,
      unit: '$',
      change: calculateChange(2700000, 3100000),
      trend: getTrend(2700000, 3100000)
    },
    {
      label: 'New Deals',
      current: 47,
      previous: 52,
      unit: 'сделок',
      change: calculateChange(47, 52),
      trend: getTrend(47, 52)
    },
    {
      label: 'Active Tasks',
      current: (data.tasks || []).filter(t => t.status === 'active').length || 4,
      previous: 6,
      unit: 'задач',
      change: calculateChange(
        (data.tasks || []).filter(t => t.status === 'active').length || 4,
        6
      ),
      trend: 'neutral'
    },
    {
      label: 'Customer Health Score',
      current: 78,
      previous: 82,
      unit: '',
      change: calculateChange(78, 82),
      trend: getTrend(78, 82)
    },
    {
      label: 'Время закрытия сделки',
      current: 34,
      previous: 28,
      unit: 'дней',
      change: calculateChange(34, 28),
      trend: getTrend(34, 28)
    }
  ];
}

function generateQuarterlyMetrics(data) {
  return [
    {
      label: 'ARR',
      current: 10105440,
      previous: 8920000,
      unit: '$',
      change: calculateChange(10105440, 8920000),
      trend: getTrend(10105440, 8920000)
    },
    {
      label: 'Net Revenue Retention',
      current: 112.6,
      previous: 108.4,
      unit: '%',
      change: calculateChange(112.6, 108.4),
      trend: getTrend(112.6, 108.4)
    },
    {
      label: 'Gross Margin',
      current: 72,
      previous: 68,
      unit: '%',
      change: calculateChange(72, 68),
      trend: getTrend(72, 68)
    },
    {
      label: 'Burn Rate',
      current: 142000,
      previous: 156000,
      unit: '$/мес',
      change: calculateChange(142000, 156000),
      trend: getTrend(142000, 156000)
    },
    {
      label: 'Runway',
      current: 18.4,
      previous: 16.2,
      unit: 'мес',
      change: calculateChange(18.4, 16.2),
      trend: getTrend(18.4, 16.2)
    },
    {
      label: 'Customer Acquisition Cost',
      current: 4800,
      previous: 5200,
      unit: '$',
      change: calculateChange(4800, 5200),
      trend: getTrend(4800, 5200)
    }
  ];
}

function calculateChange(current, previous) {
  if (!previous || previous === 0) return { percent: 0, direction: 'stable', absolute: 0 };
  const diff = current - previous;
  const percent = Math.round((diff / previous) * 1000) / 10;
  return {
    percent: Math.abs(percent),
    direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'stable',
    absolute: Math.round(diff * 100) / 100,
    isGood: null // будет заполнено контекстом
  };
}

function getTrend(current, previous) {
  if (current > previous) return 'improving';
  if (current < previous) return 'declining';
  return 'stable';
}

function generateWeeklySummary(data) {
  const changes = generateWeeklyMetrics(data);
  const improvements = changes.filter(c => c.trend === 'improving').length;
  const declines = changes.filter(c => c.trend === 'declining').length;
  
  const details = [];
  if (changes[0].trend === 'improving') details.push('Выручка выросла на ' + changes[0].change.percent + '% WoW');
  else details.push('Выручка снизилась на ' + changes[0].change.percent + '% WoW');
  
  if (changes[3].trend === 'declining') details.push('Время ответа лидам выросло — требуется внимание');
  if (changes[5].trend === 'declining') details.push('Churn rate увеличился — срочно проанализировать причины');
  
  return {
    overall: improvements > declines ? 'positive' : declines > improvements ? 'negative' : 'neutral',
    improvements,
    declines,
    unchanged: 6 - improvements - declines,
    details
  };
}

function generateMonthlySummary(data) {
  return {
    overall: 'mixed',
    revenueGrowth: '+8.2% MoM',
    pipelineHealth: 'Требует внимания (-12.9%)',
    highlights: ['Выручка показывает устойчивый рост', 'Pipeline снижается второй месяц подряд', 'Customer Health требует мониторинга'],
    risks: ['Снижение pipeline может повлиять на Q4', 'Увеличение времени закрытия сделок']
  };
}

function generateQuarterlySummary(data) {
  return {
    overall: 'positive',
    arrGrowth: '+13.3% QoQ',
    marginExpansion: '+4pp gross margin',
    highlights: ['ARR вырос на $1.18M', 'Runway увеличился на 2.2 месяца', 'CAC снижается второй квартал подряд'],
    risks: ['Net retention может замедлиться в H2', 'Burn rate требует мониторинга']
  };
}

// Generate trend history for charts
function generateTrendHistory(metric, points = 12) {
  const bases = {
    revenue: 842,
    pipeline: 2700,
    churn: 3.2,
    nps: 52,
    efficiency: 72,
    winRate: 24,
    runRate: 18.4
  };
  
  const baseValue = bases[metric] || 100;
  const volatility = metric === 'churn' || metric === 'pipeline' ? 0.08 : 0.04;
  
  const history = [];
  let value = baseValue * 0.85; // start lower for upward trend
  for (let i = 0; i < points; i++) {
    value = Math.max(0, value + (Math.random() - 0.47) * volatility * baseValue);
    history.push({
      period: i + 1,
      value: Math.round(value * 100) / 100,
      label: getPeriodLabel(i, points)
    });
  }
  return history;
}

function getPeriodLabel(index, total) {
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  if (total <= 7) return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index] || `Д${index + 1}`;
  if (total <= 12 && index < 12) return months[index];
  return `W${index + 1}`;
}

module.exports = {
  generatePopAnalysis,
  generateTrendHistory
};