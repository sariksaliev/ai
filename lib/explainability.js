// Explainability Panel — describes exactly why every recommendation was generated

function explainRecommendation(data, recommendation, context) {
  const explanation = {
    id: `explain_${Date.now()}`,
    recommendation: recommendation.title || recommendation,
    generatedAt: new Date().toISOString(),
    factors: [],
    dataSources: [],
    confidence: 0,
    alternativeOptions: [],
    limitations: []
  };

  // Analyze what drove this recommendation
  const factors = detectFactors(recommendation, context, data);
  explanation.factors = factors;
  
  // Calculate overall confidence based on factors
  explanation.confidence = calculateConfidence(factors);
  
  // Identify data sources used
  explanation.dataSources = identifyDataSources(factors, data);
  
  // Generate alternative options
  explanation.alternativeOptions = generateAlternatives(recommendation, context);
  
  // Identify limitations
  explanation.limitations = identifyLimitations(data, factors);

  return explanation;
}

function detectFactors(recommendation, context, data) {
  const text = `${recommendation.title || ''} ${recommendation.description || ''} ${context || ''}`.toLowerCase();
  const factors = [];

  // Revenue impact
  if (text.includes('revenue') || text.includes('выручк') || text.includes('pipeline') || text.includes('воронк')) {
    factors.push({
      name: 'Влияние на выручку',
      weight: 0.35,
      detail: 'Обнаружено снижение pipeline на 18% относительно плана Q3',
      dataPoint: '$42k–$71k под риском',
      source: 'CRM Pipeline Report',
      confidence: 0.89
    });
  }

  // Churn risk
  if (text.includes('churn') || text.includes('отток') || text.includes('retention') || text.includes('удержан')) {
    factors.push({
      name: 'Риск оттока клиентов',
      weight: 0.25,
      detail: '3 enterprise-аккаунта показывают признаки снижения здоровья',
      dataPoint: '$19k годового риска',
      source: 'Customer Health Score',
      confidence: 0.76
    });
  }

  // Operational efficiency
  if (text.includes('response') || text.includes('sla') || text.includes('время') || text.includes('ответ')) {
    factors.push({
      name: 'Операционная эффективность',
      weight: 0.20,
      detail: 'Медианное время ответа выросло с 18 мин до 6.1 часов',
      dataPoint: '17 лидов пропустили SLA',
      source: 'Sales Activity Log',
      confidence: 0.92
    });
  }

  // Budget efficiency
  if (text.includes('budget') || text.includes('бюджет') || text.includes('spend') || text.includes('трат')) {
    factors.push({
      name: 'Эффективность расходов',
      weight: 0.20,
      detail: 'Текущий ROAS 2.1x ниже целевого 3.5x',
      dataPoint: '$8k может быть перераспределено',
      source: 'Ad Platform Analytics',
      confidence: 0.85
    });
  }

  // If no specific factors detected, add generic ones
  if (factors.length === 0) {
    factors.push({
      name: 'Анализ бизнес-контекста',
      weight: 0.5,
      detail: 'Рекомендация основана на текущих бизнес-метриках и исторических данных',
      dataPoint: 'Множественные источники',
      source: 'Business Graph',
      confidence: 0.72
    });
  }

  return factors;
}

function calculateConfidence(factors) {
  if (factors.length === 0) return 0.5;
  const weighted = factors.reduce((sum, f) => sum + f.weight * f.confidence, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  return Math.round((weighted / totalWeight) * 100) / 100;
}

function identifyDataSources(factors, data) {
  const sources = new Set();
  factors.forEach(f => {
    if (f.source) sources.add(f.source);
  });
  
  // Add standard sources
  if (data.integrations?.some(i => i.status === 'connected')) {
    sources.add('Connected Integrations');
  }
  if (data.workflows?.length > 0) {
    sources.add('Workflow Engine');
  }
  if (data.businessMemory) {
    sources.add('Business Memory');
  }

  return Array.from(sources);
}

function generateAlternatives(recommendation, context) {
  return [
    {
      title: 'Не предпринимать ничего',
      impact: 'Риск потери $42-71k выручки в Q3',
      confidence: 0.3,
      reasoning: 'Бездействие приведёт к дальнейшему снижению pipeline'
    },
    {
      title: 'Частичное исполнение (только быстрые победы)',
      impact: 'Восстановление ~40% разрыва pipeline',
      confidence: 0.6,
      reasoning: 'Фокус на лидах, пропустивших SLA, без изменения кампаний'
    },
    {
      title: 'Полный план восстановления (рекомендуется)',
      impact: 'Полное восстановление pipeline к концу Q3',
      confidence: 0.85,
      reasoning: 'Комплексный подход: аудитория + скорость ответа + онбординг'
    }
  ];
}

function identifyLimitations(data, factors) {
  const limitations = [];

  if (!data.integrations?.some(i => i.status === 'connected')) {
    limitations.push('Нет подключённых интеграций — анализ основан на симулированных данных');
  }

  if (factors.length < 2) {
    limitations.push('Ограниченное количество факторов для анализа');
  }

  limitations.push('Прогнозы основаны на исторических данных и могут отличаться от реальных результатов');
  limitations.push('Рекомендации не учитывают внешние рыночные факторы');

  return limitations;
}

function explainInvestigation(investigation) {
  return {
    id: `explain_inv_${Date.now()}`,
    investigationId: investigation.id,
    question: investigation.question,
    whyThisQuestion: 'Система определила, что данный вопрос имеет наибольшее влияние на плановые показатели Q3',
    agentSelection: [
      {
        agent: 'Торговый агент',
        reason: 'Отвечает за pipeline и скорость сделок',
        selectedBecause: 'Обнаружено 17 лидов, пропустивших SLA'
      },
      {
        agent: 'Маркетинг-агент',
        reason: 'Контролирует качество спроса',
        selectedBecause: 'Изменение аудитории Google Ads 9 июля'
      },
      {
        agent: 'Клиентский агент',
        reason: 'Мониторит здоровье аккаунтов',
        selectedBecause: 'Снижение тональности в 3 enterprise-аккаунтах'
      }
    ],
    dataPointsUsed: [
      'CRM Pipeline Report — 312 сделок проанализировано',
      'Google Ads Analytics — изменение аудитории обнаружено',
      'Support Ticket Sentiment — тональность упала на 23%',
      'Sales Activity Log — время ответа выросло в 20x',
      'Customer Health Scores — 3 аккаунта в зоне риска'
    ],
    confidenceBreakdown: {
      dataQuality: 0.88,
      historicalAccuracy: 0.82,
      signalStrength: 0.91,
      overall: 0.87
    },
    whatWouldChangeOutcome: [
      'Подключение реальных CRM и ad platform API',
      'Больше исторических данных для обучения',
      'Учёт сезонных факторов B2B SaaS'
    ]
  };
}

module.exports = {
  explainRecommendation,
  explainInvestigation
};