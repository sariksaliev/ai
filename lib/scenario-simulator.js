// Scenario Simulator — "What if?" analysis with projected outcomes

const { generatePrediction } = require('./kpi-prediction');

function runScenario(data, params) {
  const { name, adjustments, timeframe } = params;
  
  const baseState = captureBaseState(data);
  const adjustedState = applyAdjustments(baseState, adjustments);
  const outcomes = simulateOutcomes(baseState, adjustedState, timeframe);
  
  return {
    id: `scenario_${Date.now()}`,
    name: name || 'Новый сценарий',
    createdAt: new Date().toISOString(),
    baseState,
    adjustedState,
    outcomes,
    recommendations: generateScenarioRecommendations(outcomes),
    confidence: outcomes.confidence
  };
}

function captureBaseState(data) {
  const activeTasks = data.tasks?.length || 0;
  const completedTasks = data.tasks?.filter(t => t.status === 'done' || t.lane === 'Done this week').length || 0;
  const activeWorkflows = data.workflows?.filter(w => w.status === 'in_progress').length || 0;
  
  return {
    mrr: 842000,
    arr: 10104000,
    pipeline: 4200000,
    activeDeals: 312,
    winRate: 0.22,
    churnRate: 0.062,
    nps: 52,
    activeTasks,
    completedTasks,
    completionRate: activeTasks > 0 ? Math.round((completedTasks / activeTasks) * 100) : 0,
    activeWorkflows,
    cashRunway: 18.4,
    monthlyBurn: 142000,
    employees: 48,
    markets: ['US', 'EU', 'APAC']
  };
}

function applyAdjustments(baseState, adjustments) {
  const adjusted = { ...baseState };
  
  adjustments.forEach(adj => {
    switch (adj.variable) {
      case 'mrr':
        adjusted.mrr = applyDelta(adjusted.mrr, adj.delta);
        break;
      case 'pipeline':
        adjusted.pipeline = applyDelta(adjusted.pipeline, adj.delta);
        break;
      case 'winRate':
        adjusted.winRate = clamp(adjusted.winRate + (typeof adj.delta === 'number' ? adj.delta : 0), 0, 1);
        break;
      case 'churnRate':
        adjusted.churnRate = clamp(adjusted.churnRate + (typeof adj.delta === 'number' ? adj.delta : 0), 0, 1);
        break;
      case 'nps':
        adjusted.nps = clamp(adjusted.nps + (typeof adj.delta === 'number' ? adj.delta : 0), 0, 100);
        break;
      case 'burnRate':
        adjusted.monthlyBurn = applyDelta(adjusted.monthlyBurn, adj.delta);
        adjusted.cashRunway = adjusted.monthlyBurn > 0 ? (adjusted.cashRunway * baseState.monthlyBurn) / adjusted.monthlyBurn : adjusted.cashRunway;
        break;
      case 'employees':
        adjusted.employees = Math.max(1, Math.round(applyDelta(adjusted.employees, adj.delta)));
        break;
      default:
        break;
    }
  });

  return adjusted;
}

function applyDelta(value, delta) {
  if (typeof delta === 'number') {
    // Absolute delta
    return value + delta;
  } else if (typeof delta === 'string' && delta.endsWith('%')) {
    // Percentage delta
    const pct = parseFloat(delta) / 100;
    return Math.round(value * (1 + pct));
  }
  return value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function simulateOutcomes(baseState, adjustedState, timeframe) {
  const months = parseTimeframe(timeframe);
  
  // Calculate compound effects over time
  const revenueImpact = calculateRevenueImpact(baseState, adjustedState, months);
  const pipelineImpact = calculatePipelineImpact(baseState, adjustedState, months);
  const churnImpact = calculateChurnImpact(baseState, adjustedState, months);
  const efficiencyImpact = calculateEfficiencyImpact(baseState, adjustedState);
  
  const totalRevenueImpact = revenueImpact.total;
  const totalPipelineImpact = pipelineImpact.total;
  
  return {
    timeframe: `${months} мес.`,
    scenarios: {
      optimistic: {
        probability: 0.25,
        description: 'Благоприятные условия и полное исполнение',
        revenue: Math.round(baseState.mrr * months + totalRevenueImpact * 1.5),
        pipeline: Math.round(baseState.pipeline + totalPipelineImpact * 1.5),
        arr: Math.round(baseState.arr + totalRevenueImpact * 12 * 1.3),
        nps: Math.min(100, baseState.nps + 15),
        churn: Math.max(0, baseState.churnRate - 0.03)
      },
      expected: {
        probability: 0.50,
        description: 'Стандартное исполнение с текущими трендами',
        revenue: Math.round(baseState.mrr * months + totalRevenueImpact),
        pipeline: Math.round(baseState.pipeline + totalPipelineImpact),
        arr: Math.round(baseState.arr + totalRevenueImpact * 12),
        nps: Math.min(100, baseState.nps + 8),
        churn: Math.max(0, baseState.churnRate - 0.015)
      },
      pessimistic: {
        probability: 0.25,
        description: 'Задержки и неблагоприятные факторы',
        revenue: Math.round(baseState.mrr * months + totalRevenueImpact * 0.3),
        pipeline: Math.round(baseState.pipeline + totalPipelineImpact * 0.3),
        arr: Math.round(baseState.arr + totalRevenueImpact * 12 * 0.2),
        nps: Math.max(0, baseState.nps - 5),
        churn: Math.min(1, baseState.churnRate + 0.02)
      }
    },
    keyMetrics: [
      {
        name: 'Выручка',
        base: `$${(baseState.mrr / 1000).toFixed(0)}k/мес`,
        projected: {
          optimistic: `$${(Math.round((baseState.mrr * months + totalRevenueImpact * 1.5) / months) / 1000).toFixed(0)}k/мес`,
          expected: `$${(Math.round((baseState.mrr * months + totalRevenueImpact) / months) / 1000).toFixed(0)}k/мес`,
          pessimistic: `$${(Math.round((baseState.mrr * months + totalRevenueImpact * 0.3) / months) / 1000).toFixed(0)}k/мес`
        }
      },
      {
        name: 'Pipeline',
        base: `$${(baseState.pipeline / 1e6).toFixed(1)}M`,
        projected: {
          optimistic: pipelineImpact.optimistic,
          expected: pipelineImpact.expected,
          pessimistic: pipelineImpact.pessimistic
        }
      },
      {
        name: 'Churn Rate',
        base: `${(baseState.churnRate * 100).toFixed(1)}%`,
        projected: {
          optimistic: `${(Math.max(0, baseState.churnRate - 0.03) * 100).toFixed(1)}%`,
          expected: `${(Math.max(0, baseState.churnRate - 0.015) * 100).toFixed(1)}%`,
          pessimistic: `${(Math.min(1, baseState.churnRate + 0.02) * 100).toFixed(1)}%`
        }
      },
      {
        name: 'NPS',
        base: baseState.nps.toString(),
        projected: {
          optimistic: Math.min(100, baseState.nps + 15).toString(),
          expected: Math.min(100, baseState.nps + 8).toString(),
          pessimistic: Math.max(0, baseState.nps - 5).toString()
        }
      }
    ],
    confidence: calculateScenarioConfidence(baseState, adjustedState),
    risks: identifyRisks(baseState, adjustedState),
    opportunities: identifyOpportunities(baseState, adjustedState)
  };
}

function calculateRevenueImpact(base, adjusted, months) {
  const mrrDiff = adjusted.mrr - base.mrr;
  const cumulativeImpact = mrrDiff * months * (1 + 0.05 * (months - 1)); // compounding growth
  const annualizedImpact = mrrDiff * 12;
  
  return {
    monthly: mrrDiff,
    total: cumulativeImpact,
    annualized: annualizedImpact,
    arrProjection: base.arr + annualizedImpact
  };
}

function calculatePipelineImpact(base, adjusted, months) {
  const pipelineDiff = adjusted.pipeline - base.pipeline;
  const conversionImpact = (adjusted.winRate - base.winRate) * adjusted.pipeline;
  
  const optimistic = `$${(((base.pipeline + pipelineDiff) * (1 + 0.15 * months)) / 1e6).toFixed(1)}M`;
  const expected = `$${((base.pipeline + pipelineDiff + conversionImpact * 0.5) / 1e6).toFixed(1)}M`;
  const pessimistic = `$${((base.pipeline + pipelineDiff * 0.3) / 1e6).toFixed(1)}M`;
  
  return { total: pipelineDiff + conversionImpact, optimistic, expected, pessimistic };
}

function calculateChurnImpact(base, adjusted, months) {
  const churnDiff = adjusted.churnRate - base.churnRate;
  const revenueProtected = base.mrr * (-churnDiff) * months;
  return {
    rate: churnDiff,
    revenueProtected,
    accountsAffected: Math.round(Math.abs(churnDiff) * 48) // 48 employees as proxy
  };
}

function calculateEfficiencyImpact(base, adjusted) {
  const burnDiff = base.monthlyBurn - adjusted.monthlyBurn;
  const runwayDiff = adjusted.cashRunway - base.cashRunway;
  return {
    monthlySavings: Math.max(0, burnDiff),
    runwayExtension: Math.max(0, runwayDiff),
    productivityGain: Math.max(0, (adjusted.completionRate - base.completionRate) / 100)
  };
}

function parseTimeframe(timeframe) {
  if (!timeframe) return 3;
  const match = timeframe.match(/(\d+)/);
  return match ? Math.max(1, Math.min(12, parseInt(match[1]))) : 3;
}

function calculateScenarioConfidence(base, adjusted) {
  const factors = [];
  
  // Smaller changes = higher confidence
  const changeMagnitude = Math.abs(adjusted.mrr - base.mrr) / base.mrr;
  factors.push(Math.max(0, 1 - changeMagnitude * 2));
  
  // More data = higher confidence
  factors.push(0.8);
  
  const avg = factors.reduce((s, v) => s + v, 0) / factors.length;
  return Math.round(clamp(avg, 0.3, 0.95) * 100) / 100;
}

function identifyRisks(base, adjusted) {
  const risks = [];
  
  if (adjusted.churnRate > base.churnRate) {
    risks.push({
      severity: 'high',
      description: `Повышение оттока до ${(adjusted.churnRate * 100).toFixed(1)}%`,
      impact: 'Снижение MRR и рост CAC'
    });
  }
  
  if (adjusted.monthlyBurn > base.monthlyBurn * 1.1) {
    risks.push({
      severity: 'medium',
      description: 'Увеличение burn rate',
      impact: 'Сокращение runway на 2+ месяца'
    });
  }
  
  if (risks.length === 0) {
    risks.push({
      severity: 'low',
      description: 'Минимальные operational риски',
      impact: 'Изменения в пределах допустимых отклонений'
    });
  }
  
  return risks;
}

function identifyOpportunities(base, adjusted) {
  const opportunities = [];
  
  if (adjusted.winRate > base.winRate) {
    opportunities.push({
      type: 'revenue',
      description: `Рост win rate с ${(base.winRate * 100).toFixed(0)}% до ${(adjusted.winRate * 100).toFixed(0)}%`,
      potential: `+$${Math.round((adjusted.winRate - base.winRate) * adjusted.pipeline).toLocaleString()} pipeline`
    });
  }
  
  if (adjusted.monthlyBurn < base.monthlyBurn) {
    opportunities.push({
      type: 'efficiency',
      description: `Снижение monthly burn на $${(base.monthlyBurn - adjusted.monthlyBurn).toLocaleString()}`,
      potential: `+${((base.cashRunway / base.monthlyBurn * adjusted.monthlyBurn) - base.cashRunway).toFixed(1)} мес. runway`
    });
  }
  
  if (adjusted.nps > base.nps) {
    opportunities.push({
      type: 'retention',
      description: `Рост NPS с ${base.nps} до ${adjusted.nps}`,
      potential: 'Снижение оттока и рост Expansion Revenue'
    });
  }
  
  if (opportunities.length === 0) {
    opportunities.push({
      type: 'stability',
      description: 'Текущие метрики стабильны',
      potential: 'База для постепенного роста'
    });
  }
  
  return opportunities;
}

function generateScenarioRecommendations(outcomes) {
  return [
    'Начать с быстрых побед: восстановить SLA ответа лидам',
    'Перераспределить бюджет в performance-каналы с высоким ROAS',
    'Запустить программу спасения для 3 enterprise-аккаунтов',
    'Мониторить ключевые метрики еженедельно в течение первого месяца'
  ];
}

function getScenarioPresets() {
  return [
    {
      id: 'preset_1',
      name: 'Оптимизация расходов',
      description: 'Сокращение burn rate на 15% за счёт автоматизации',
      adjustments: [
        { variable: 'burnRate', delta: '-15%' },
        { variable: 'employees', delta: '-5' }
      ],
      timeframe: '3 months'
    },
    {
      id: 'preset_2',
      name: 'EU Growth Push',
      description: 'Увеличение инвестиций в EU pipeline и команду',
      adjustments: [
        { variable: 'pipeline', delta: '+25%' },
        { variable: 'mrr', delta: '+12%' },
        { variable: 'employees', delta: '+8' },
        { variable: 'burnRate', delta: '+20%' }
      ],
      timeframe: '6 months'
    },
    {
      id: 'preset_3',
      name: 'Retention Focus',
      description: 'Программа удержания клиентов и повышения NPS',
      adjustments: [
        { variable: 'churnRate', delta: '-0.02' },
        { variable: 'nps', delta: '+10' },
        { variable: 'mrr', delta: '+5%' }
      ],
      timeframe: '3 months'
    },
    {
      id: 'preset_4',
      name: 'Aggressive Growth',
      description: 'Максимальный рост любой ценой',
      adjustments: [
        { variable: 'mrr', delta: '+30%' },
        { variable: 'pipeline', delta: '+50%' },
        { variable: 'employees', delta: '+15' },
        { variable: 'burnRate', delta: '+40%' }
      ],
      timeframe: '6 months'
    }
  ];
}

module.exports = {
  runScenario,
  getScenarioPresets
};