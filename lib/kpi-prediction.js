// KPI Prediction Engine — forecasts revenue, pipeline, ARR and confidence after proposed actions

function generatePrediction(data, action, context) {
  const baseRevenue = 842000; // $842k MRR
  const basePipeline = 4200000; // $4.2M pipeline
  const baseARR = baseRevenue * 12; // ~$10.1M ARR
  const baseConfidence = 0.78;

  // Calculate impact based on action type
  const impact = calculateActionImpact(action, context, data);
  
  const prediction = {
    id: `pred_${Date.now()}`,
    action: action.title || action,
    generatedAt: new Date().toISOString(),
    current: {
      revenue: baseRevenue,
      pipeline: basePipeline,
      arr: baseARR,
      confidence: baseConfidence
    },
    projected: {
      revenue: Math.round(baseRevenue * (1 + impact.revenueDelta)),
      pipeline: Math.round(basePipeline * (1 + impact.pipelineDelta)),
      arr: Math.round(baseARR * (1 + impact.arrDelta)),
      confidence: Math.min(0.95, baseConfidence + impact.confidenceDelta)
    },
    impact: {
      revenueDelta: impact.revenueDelta,
      pipelineDelta: impact.pipelineDelta,
      arrDelta: impact.arrDelta,
      confidenceDelta: impact.confidenceDelta,
      timeframe: impact.timeframe,
      riskLevel: impact.riskLevel
    },
    breakdown: impact.breakdown || [],
    scenarios: generateScenarios(baseRevenue, basePipeline, impact)
  };

  return prediction;
}

function calculateActionImpact(action, context, data) {
  const actionType = detectActionType(action, context);
  
  const impactTemplates = {
    pipeline_recovery: {
      revenueDelta: 0.084, // +8.4% revenue
      pipelineDelta: 0.18,  // +18% pipeline
      arrDelta: 0.072,
      confidenceDelta: 0.05,
      timeframe: '21 days',
      riskLevel: 'moderate',
      breakdown: [
        { metric: 'SQL Conversion', current: '18%', projected: '24%', confidence: 0.82 },
        { metric: 'Deal Velocity', current: '45 days', projected: '38 days', confidence: 0.76 },
        { metric: 'Win Rate', current: '22%', projected: '28%', confidence: 0.79 }
      ]
    },
    budget_reallocation: {
      revenueDelta: 0.042,
      pipelineDelta: 0.11,
      arrDelta: 0.038,
      confidenceDelta: 0.03,
      timeframe: '14 days',
      riskLevel: 'low',
      breakdown: [
        { metric: 'ROAS', current: '2.1x', projected: '3.4x', confidence: 0.85 },
        { metric: 'SQL per $1k', current: '4.2', projected: '7.8', confidence: 0.81 }
      ]
    },
    retention_intervention: {
      revenueDelta: 0.023,
      pipelineDelta: 0.04,
      arrDelta: 0.045,
      confidenceDelta: 0.06,
      timeframe: '30 days',
      riskLevel: 'low',
      breakdown: [
        { metric: 'Churn Rate', current: '6.2%', projected: '3.8%', confidence: 0.74 },
        { metric: 'NPS', current: '52', projected: '61', confidence: 0.68 }
      ]
    },
    expansion: {
      revenueDelta: 0.12,
      pipelineDelta: 0.15,
      arrDelta: 0.14,
      confidenceDelta: 0.04,
      timeframe: '45 days',
      riskLevel: 'moderate',
      breakdown: [
        { metric: 'Expansion Revenue', current: '$84k', projected: '$112k', confidence: 0.72 },
        { metric: 'Account Penetration', current: '34%', projected: '48%', confidence: 0.69 }
      ]
    },
    cost_optimization: {
      revenueDelta: -0.01,
      pipelineDelta: 0.02,
      arrDelta: 0.015,
      confidenceDelta: 0.02,
      timeframe: '7 days',
      riskLevel: 'low',
      breakdown: [
        { metric: 'Burn Rate', current: '$142k/mo', projected: '$128k/mo', confidence: 0.88 },
        { metric: 'Runway', current: '18.4 mo', projected: '20.2 mo', confidence: 0.85 }
      ]
    },
    default: {
      revenueDelta: 0.035,
      pipelineDelta: 0.08,
      arrDelta: 0.03,
      confidenceDelta: 0.02,
      timeframe: '14 days',
      riskLevel: 'moderate',
      breakdown: [
        { metric: 'Overall Impact', current: 'Baseline', projected: 'Improved', confidence: 0.75 }
      ]
    }
  };

  return impactTemplates[actionType] || impactTemplates.default;
}

function detectActionType(action, context) {
  const text = `${action.title || ''} ${action.description || ''} ${context || ''}`.toLowerCase();
  
  if (text.includes('pipeline') || text.includes('eu') || text.includes('воронк') || text.includes('сделк')) 
    return 'pipeline_recovery';
  if (text.includes('budget') || text.includes('realloc') || text.includes('бюджет') || text.includes('перераспред'))
    return 'budget_reallocation';
  if (text.includes('retention') || text.includes('churn') || text.includes('отток') || text.includes('удержан'))
    return 'retention_intervention';
  if (text.includes('expansion') || text.includes('upsell') || text.includes('расширен') || text.includes('upsell'))
    return 'expansion';
  if (text.includes('cost') || text.includes('optim') || text.includes('затрат') || text.includes('оптимизац'))
    return 'cost_optimization';
  
  return 'default';
}

function generateScenarios(baseRevenue, basePipeline, impact) {
  return {
    optimistic: {
      probability: 0.25,
      revenue: Math.round(baseRevenue * (1 + impact.revenueDelta * 1.5)),
      pipeline: Math.round(basePipeline * (1 + impact.pipelineDelta * 1.5)),
      description: 'Благоприятные рыночные условия и полное исполнение'
    },
    expected: {
      probability: 0.50,
      revenue: Math.round(baseRevenue * (1 + impact.revenueDelta)),
      pipeline: Math.round(basePipeline * (1 + impact.pipelineDelta)),
      description: 'Стандартное исполнение с учётом текущих трендов'
    },
    pessimistic: {
      probability: 0.25,
      revenue: Math.round(baseRevenue * (1 + impact.revenueDelta * 0.4)),
      pipeline: Math.round(basePipeline * (1 + impact.pipelineDelta * 0.4)),
      description: 'Задержки исполнения и неблагоприятные факторы'
    }
  };
}

function getConfidenceLabel(confidence) {
  if (confidence >= 0.9) return 'very_high';
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.7) return 'moderate';
  if (confidence >= 0.6) return 'low';
  return 'very_low';
}

function getRiskLabel(riskLevel) {
  const labels = {
    low: 'Низкий — минимальные негативные последствия',
    moderate: 'Умеренный — требует мониторинга',
    high: 'Высокий — значительный риск для плана Q3',
    critical: 'Критический — угроза для бизнеса'
  };
  return labels[riskLevel] || labels.moderate;
}

module.exports = {
  generatePrediction,
  getConfidenceLabel,
  getRiskLabel
};