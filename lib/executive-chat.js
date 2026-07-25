// Executive AI Chat — understands business questions and launches investigations
// Multi-agent collaboration with live conversation between agents

const crypto = require('crypto');
const { getRelevantMemory } = require('./business-memory');
const { generatePrediction } = require('./kpi-prediction');
const { explainRecommendation } = require('./explainability');
const { generateAgentCollaboration } = require('./ai-provider');

const AGENTS = {
  sales: {
    id: 'sales',
    name: 'Торговый агент',
    letter: 'S',
    color: 'sales-orb',
    expertise: 'Pipeline, deal velocity, win rates, sales activity',
    tools: ['CRM Analysis', 'Deal Inspection', 'Sales Activity Log', 'Forecast Comparison']
  },
  marketing: {
    id: 'marketing',
    name: 'Маркетинг-агент',
    letter: 'M',
    color: 'finance-orb',
    expertise: 'Demand generation, campaign performance, audience quality',
    tools: ['Ad Platform Analytics', 'Campaign Performance', 'Audience Analysis', 'Budget Tracker']
  },
  finance: {
    id: 'finance',
    name: 'Финансовый агент',
    letter: 'F',
    color: 'ops-orb',
    expertise: 'Revenue, margins, runway, credit risk, profitability',
    tools: ['Financial Model', 'Burn Rate Analysis', 'Runway Calculator', 'Profitability Scanner']
  },
  customer: {
    id: 'customer',
    name: 'Клиентский агент',
    letter: 'C',
    color: 'sales-orb',
    expertise: 'Retention, expansion, health scores, sentiment',
    tools: ['Health Score Monitor', 'Sentiment Analysis', 'Usage Analytics', 'Renewal Tracker']
  },
  operations: {
    id: 'operations',
    name: 'Операционный агент',
    letter: 'O',
    color: 'ops-orb',
    expertise: 'Execution speed, bottlenecks, cross-functional tasks',
    tools: ['Workflow Monitor', 'Bottleneck Detector', 'SLA Tracker', 'Resource Allocator']
  },
  ceo: {
    id: 'ceo',
    name: 'CEO-агент',
    letter: 'E',
    color: 'sales-orb',
    expertise: 'Strategy, prioritization, cross-functional coordination',
    tools: ['Strategy Planner', 'Priority Matrix', 'Cross-functional Coordinator', 'Risk Assessor']
  }
};

async function processChatMessage(data, message) {
  const question = message.text || message;
  const context = message.context || '';
  
  // Generate conversation ID
  const conversationId = message.conversationId || `conv_${Date.now()}`;
  
  // Determine which agents to involve
  const involvedAgents = selectAgents(question, context);
  
  // Generate agent collaboration conversation (try real AI first)
  const collaboration = await generateAICollaboration(question, involvedAgents, context);
  
  // Generate investigation if needed
  const investigation = createInvestigationFromChat(data, question, collaboration);
  
  // Generate prediction
  const prediction = generatePrediction(data, { title: investigation.summary }, question);
  
  // Generate explanation
  const explanation = explainRecommendation(data, { title: investigation.summary }, question);
  
  // Get relevant business memory
  const memory = getRelevantMemory(data, question);
  
  return {
    id: `chat_${Date.now()}`,
    conversationId,
    question,
    timestamp: new Date().toISOString(),
    response: {
      summary: investigation.summary,
      confidence: investigation.confidence,
      impact: investigation.impact,
      agents: involvedAgents.map(a => ({
        id: a.id,
        name: a.name,
        letter: a.letter,
        color: a.color
      })),
      collaboration,
      investigation: {
        id: investigation.id,
        evidence: investigation.evidence,
        plan: investigation.plan
      },
      prediction: {
        current: prediction.current,
        projected: prediction.projected,
        scenarios: prediction.scenarios,
        impact: prediction.impact
      },
      explanation: {
        factors: explanation.factors,
        dataSources: explanation.dataSources,
        confidence: explanation.confidence,
        alternatives: explanation.alternativeOptions,
        limitations: explanation.limitations
      },
      memory: {
        relevantGoals: memory.goals,
        previousApprovals: memory.recentApprovals,
        activeInitiatives: memory.activeInitiatives
      },
      aiEnabled: collaboration.aiEnabled
    },
    suggestions: generateFollowUpSuggestions(question, investigation)
  };
}

function selectAgents(question, context) {
  const text = `${question} ${context}`.toLowerCase();
  const selected = [];
  
  // Always include CEO for strategy
  selected.push(AGENTS.ceo);
  
  // Sales-related keywords
  if (text.includes('pipeline') || text.includes('сделк') || text.includes('воронк') || 
      text.includes('revenue') || text.includes('выручк') || text.includes('продаж') ||
      text.includes('lead') || text.includes('лид') || text.includes('conversion')) {
    selected.push(AGENTS.sales);
  }
  
  // Marketing-related keywords
  if (text.includes('marketing') || text.includes('маркет') || text.includes('campaign') ||
      text.includes('кампа') || text.includes('ads') || text.includes('реклам') ||
      text.includes('audience') || text.includes('аудит') || text.includes('трафик')) {
    selected.push(AGENTS.marketing);
  }
  
  // Finance-related keywords
  if (text.includes('финанс') || text.includes('budget') || text.includes('бюджет') ||
      text.includes('cost') || text.includes('затрат') || text.includes('runway') ||
      text.includes('margin') || text.includes('марж') || text.includes('profit')) {
    selected.push(AGENTS.finance);
  }
  
  // Customer-related keywords
  if (text.includes('клиент') || text.includes('customer') || text.includes('churn') ||
      text.includes('отток') || text.includes('retention') || text.includes('удержан') ||
      text.includes('nps') || text.includes('support') || text.includes('поддержк')) {
    selected.push(AGENTS.customer);
  }
  
  // Operations-related keywords
  if (text.includes('операц') || text.includes('operation') || text.includes('process') ||
      text.includes('процесс') || text.includes('workflow') || text.includes('sla') ||
      text.includes('bottleneck') || text.includes('блокер')) {
    selected.push(AGENTS.operations);
  }
  
  // If no specific agents matched, add all for comprehensive analysis
  if (selected.length <= 1) {
    selected.push(AGENTS.sales, AGENTS.marketing, AGENTS.finance, AGENTS.customer, AGENTS.operations);
  }
  
  return selected;
}

async function generateAICollaboration(question, agents, context) {
  // Try real AI collaboration
  const aiResult = await generateAgentCollaboration(question, agents, context);
  
  if (aiResult && aiResult.parsed) {
    const steps = [];
    const startTime = Date.now();
    const collab = aiResult.parsed;
    
    // CEO initiation
    steps.push({
      agent: AGENTS.ceo,
      type: 'initiation',
      message: `Анализирую запрос: "${question}". Определяю необходимые ресурсы.`,
      timestamp: new Date(startTime).toISOString(),
      duration: 0
    });
    
    // AI-generated findings per agent
    agents.filter(a => a.id !== 'ceo').forEach((agent, i) => {
      const finding = collab.findings?.find(f => f.agent === agent.id);
      steps.push({
        agent,
        type: 'analysis',
        message: finding?.finding || `${agent.name}: анализ выполнен.`,
        timestamp: new Date(startTime + (i + 1) * 800).toISOString(),
        duration: 600 + Math.round(Math.random() * 400),
        findings: {
          confidence: finding?.confidence || 0.8,
          keyInsight: finding?.finding?.substring(0, 100) || 'Анализ выполнен',
          dataPoints: finding?.dataPoints || []
        }
      });
    });
    
    // CEO synthesis
    steps.push({
      agent: AGENTS.ceo,
      type: 'synthesis',
      message: `Синтезирую результаты агентов. Ключевые выводы: ${collab.analysis}`,
      timestamp: new Date(startTime + agents.length * 800).toISOString(),
      duration: 500
    });
    
    // CEO final recommendation
    steps.push({
      agent: AGENTS.ceo,
      type: 'recommendation',
      message: collab.recommendation,
      timestamp: new Date(startTime + (agents.length + 1) * 800).toISOString(),
      duration: 300,
      isFinal: true
    });
    
    return {
      conversationId: `collab_${Date.now()}`,
      totalDuration: Math.round((agents.length + 1) * 800),
      agentsInvolved: agents.map(a => ({ id: a.id, name: a.name, letter: a.letter })),
      steps,
      aiEnabled: true,
      aiAnalysis: collab.analysis,
      aiConfidence: collab.confidence,
      aiImpact: collab.impact
    };
  }
  
  // Fallback to simulation
  const steps = [];
  const startTime = Date.now();
  
  steps.push({
    agent: AGENTS.ceo,
    type: 'initiation',
    message: `Анализирую запрос: "${question}". Определяю необходимые ресурсы.`,
    timestamp: new Date(startTime).toISOString(),
    duration: 0
  });
  
  agents.filter(a => a.id !== 'ceo').forEach((agent, i) => {
    const analysisTime = 800 + Math.random() * 1200;
    steps.push({
      agent,
      type: 'analysis',
      message: generateAgentAnalysis(agent, question),
      timestamp: new Date(startTime + (i + 1) * 1000).toISOString(),
      duration: Math.round(analysisTime),
      findings: generateAgentFindings(agent, question)
    });
  });
  
  steps.push({
    agent: AGENTS.ceo,
    type: 'synthesis',
    message: `Синтезирую результаты ${agents.length - 1} агентов. Выявляю паттерны и противоречия.`,
    timestamp: new Date(startTime + agents.length * 1000).toISOString(),
    duration: 600
  });
  
  steps.push({
    agent: AGENTS.ceo,
    type: 'recommendation',
    message: generateCEORecommendation(question, agents),
    timestamp: new Date(startTime + (agents.length + 1) * 1000).toISOString(),
    duration: 400,
    isFinal: true
  });
  
  return {
    conversationId: `collab_${Date.now()}`,
    totalDuration: Math.round((agents.length + 1) * 1000),
    agentsInvolved: agents.map(a => ({ id: a.id, name: a.name, letter: a.letter })),
    steps,
    aiEnabled: false
  };
}

function simulateAgentCollaboration(data, question, agents) {
  const steps = [];
  const startTime = Date.now();
  
  // CEO initiates
  steps.push({
    agent: AGENTS.ceo,
    type: 'initiation',
    message: `Анализирую запрос: "${question}". Определяю необходимые ресурсы.`,
    timestamp: new Date(startTime).toISOString(),
    duration: 0
  });
  
  // Each involved agent does their analysis
  agents.filter(a => a.id !== 'ceo').forEach((agent, i) => {
    const analysisTime = 800 + Math.random() * 1200;
    steps.push({
      agent,
      type: 'analysis',
      message: generateAgentAnalysis(agent, question),
      timestamp: new Date(startTime + (i + 1) * 1000).toISOString(),
      duration: Math.round(analysisTime),
      findings: generateAgentFindings(agent, question)
    });
  });
  
  // CEO synthesizes
  steps.push({
    agent: AGENTS.ceo,
    type: 'synthesis',
    message: `Синтезирую результаты ${agents.length - 1} агентов. Выявляю паттерны и противоречия.`,
    timestamp: new Date(startTime + agents.length * 1000).toISOString(),
    duration: 600
  });
  
  // CEO presents final recommendation
  steps.push({
    agent: AGENTS.ceo,
    type: 'recommendation',
    message: generateCEORecommendation(question, agents),
    timestamp: new Date(startTime + (agents.length + 1) * 1000).toISOString(),
    duration: 400,
    isFinal: true
  });
  
  return {
    conversationId: `collab_${Date.now()}`,
    totalDuration: Math.round((agents.length + 1) * 1000),
    agentsInvolved: agents.map(a => ({ id: a.id, name: a.name, letter: a.letter })),
    steps
  };
}

function generateAgentAnalysis(agent, question) {
  const templates = {
    sales: [
      'Анализирую pipeline: 312 активных сделок, 17 пропустили SLA ответа.',
      'Проверяю воронку: конверсия SQL→Opportunity упала на 24% за последние 2 недели.',
      'Сканирую активность: медианное время ответа выросло с 18 мин до 6.1 часов.',
      'Оцениваю скорость сделок: 3 enterprise-сделки застряли на стадии negotiation.'
    ],
    marketing: [
      'Анализирую кампании: изменение аудитории Google Ads 9 июля привело к падению SQL.',
      'Проверяю эффективность: ROAS упал с 3.2x до 2.1x после смены креативов.',
      'Сканирую каналы: LinkedIn Ads показывают +15% CTR, но низкую конверсию в MQL.',
      'Оцениваю бюджет: $8k в бренд-кампаниях можно перераспределить в performance.'
    ],
    finance: [
      'Анализирую финансовую модель: текущий runway 18.4 месяца, burn rate $142k/мес.',
      'Проверяю маржинальность: gross margin 72%, но EU операции на 8% менее эффективны.',
      'Сканирую риски: $42-71k выручки под риском в Q3 при текущем тренде.',
      'Оцениваю ROI: каждый день задержки восстановления pipeline стоит ~$3.4k.'
    ],
    customer: [
      'Мониторю здоровье аккаунтов: 3 enterprise-клиента показывают снижение тональности.',
      'Анализирую использование: Acme Corp увеличила usage на 34%, потенциал expansion $28k.',
      'Проверяю NPS: текущий 52, но среди EU-клиентов упал до 41.',
      'Сканирую продления: 7 аккаунтов с renewal в ближайшие 60 дней, 3 под риском.'
    ],
    operations: [
      'Анализирую bottlenecks: security review блокирует запуск продукта 4 дня.',
      'Проверяю SLA: 82% обязательств выполняется в срок, но EU-процессы отстают.',
      'Сканирую ресурсы: команда поддержки перегружена, время ответа растёт.',
      'Оцениваю кросс-функциональные задачи: 3 блокера требуют внимания CEO.'
    ]
  };
  
  const agentTemplates = templates[agent.id] || templates.sales;
  return agentTemplates[Math.floor(Math.random() * agentTemplates.length)];
}

function generateAgentFindings(agent, question) {
  const findings = {
    sales: {
      confidence: 0.82 + Math.random() * 0.12,
      keyInsight: '17 лидов пропустили SLA ответа, что составляет ~40% разрыва pipeline',
      dataPoints: ['312 deals analyzed', '24% conversion drop', '6.1h avg response time']
    },
    marketing: {
      confidence: 0.78 + Math.random() * 0.15,
      keyInsight: 'Изменение аудитории Google Ads 9 июля — основной драйвер падения SQL',
      dataPoints: ['Google Ads change detected', 'ROAS dropped 34%', '$8k reallocation opportunity']
    },
    finance: {
      confidence: 0.85 + Math.random() * 0.1,
      keyInsight: '$42-71k выручки под риском, каждый день задержки стоит $3.4k',
      dataPoints: ['18.4mo runway', '72% gross margin', '$3.4k/day delay cost']
    },
    customer: {
      confidence: 0.76 + Math.random() * 0.15,
      keyInsight: '3 enterprise-аккаунта показывают признаки оттока, $19k годового риска',
      dataPoints: ['3 accounts at risk', 'NPS dropped to 41 in EU', 'Acme $28k expansion potential']
    },
    operations: {
      confidence: 0.88 + Math.random() * 0.08,
      keyInsight: 'Security review блокирует запуск, EU-процессы отстают от SLA',
      dataPoints: ['4 day blocker', '82% on-time delivery', '3 cross-functional blockers']
    }
  };
  
  return findings[agent.id] || findings.sales;
}

function generateCEORecommendation(question, agents) {
  const agentNames = agents.filter(a => a.id !== 'ceo').map(a => a.name).join(', ');
  return `На основе анализа ${agentNames} рекомендую комплексный план восстановления: восстановить SLA ответа лидам (быстрая победа), скорректировать аудиторию Google Ads, запустить программу спасения для 3 enterprise-аккаунтов. Потенциальное влияние: $42-71k восстановленной выручки в Q3.`;
}

function createInvestigationFromChat(data, question, collaboration) {
  const investigation = {
    id: `inv_${Date.now()}`,
    question,
    status: 'draft',
    confidence: collaboration.aiConfidence 
      ? Math.round(collaboration.aiConfidence * 100)
      : Math.round((0.78 + Math.random() * 0.15) * 100),
    summary: collaboration.aiAnalysis 
      || generateSummary(question),
    impact: collaboration.aiImpact || '$42–71k',
    agents: collaboration.agentsInvolved,
    evidence: collaboration.aiEnabled 
      ? (collaboration.steps.filter(s => s.type === 'analysis').map(s => ({
          title: `${s.agent.name}: ${s.findings?.keyInsight || s.message}`,
          detail: s.message,
          confidence: s.findings?.confidence || 0.8,
          source: s.agent.id
        })))
      : generateEvidence(question),
    plan: generatePlan(question),
    citations: [],
    createdAt: new Date().toISOString(),
    collaboration,
    aiGenerated: collaboration.aiEnabled
  };
  
  data.investigations.unshift(investigation);
  return investigation;
}

function generateSummary(question) {
  const summaries = {
    pipeline: 'EU pipeline снизился из-за качества спроса и скорости реакции. Требуется комплексное восстановление.',
    churn: 'Обнаружены признаки оттока среди enterprise-клиентов. Необходима программа удержания.',
    budget: 'Маркетинговый бюджет может быть оптимизирован. Рекомендуется перераспределение в performance-каналы.',
    default: 'Мульти-агентный анализ завершён. Обнаружены операционные риски, требующие внимания CEO.'
  };
  
  const q = question.toLowerCase();
  if (q.includes('pipeline') || q.includes('воронк') || q.includes('сделк')) return summaries.pipeline;
  if (q.includes('churn') || q.includes('отток') || q.includes('клиент')) return summaries.churn;
  if (q.includes('budget') || q.includes('бюджет') || q.includes('деньг')) return summaries.budget;
  return summaries.default;
}

function generateEvidence(question) {
  return [
    {
      title: 'SQL упал на 24% после изменения аудитории кампании',
      detail: 'Маркетинг-агент нашёл изменение в Google Ads 9 июля. Это ~61% разрыва pipeline.',
      source: 'Google Ads Analytics',
      confidence: 0.89
    },
    {
      title: 'Медианное время ответа выросло с 18 минут до 6.1 часов',
      detail: 'Торговый агент нашёл 17 лидов, пропустивших SLA.',
      source: 'Sales Activity Log',
      confidence: 0.92
    },
    {
      title: 'Тон поддержки упал среди 3 enterprise-аккаунтов',
      detail: 'Клиентский агент связывает это с задержкой онбординга, создавая $19k риска продления.',
      source: 'Customer Health Score',
      confidence: 0.76
    }
  ];
}

function generatePlan(question) {
  return [
    'Восстановить высокоинтентную EU аудиторию в Google Ads (Маркетинг-агент, сегодня)',
    'Подготовить follow-up для 17 задержанных лидов (Торговый агент, сегодня)',
    'Открыть интервенции по продлению для 3 аккаунтов (Клиентский агент, завтра)',
    'Запустить weekly review процессов с SLA (Операционный агент, еженедельно)',
    'Мониторить восстановление pipeline через KPI Prediction Engine (CEO, daily)'
  ];
}

function generateFollowUpSuggestions(question, investigation) {
  return [
    'Показать детальный прогноз KPI',
    'Объяснить, почему выбраны эти агенты',
    'Какие альтернативные стратегии возможны?',
    'Запустить выполнение плана',
    'Сравнить с предыдущими расследованиями'
  ];
}

function getChatHistory(data) {
  if (!data.chatHistory) data.chatHistory = [];
  return data.chatHistory;
}

function saveChatMessage(data, message) {
  if (!data.chatHistory) data.chatHistory = [];
  data.chatHistory.unshift(message);
  if (data.chatHistory.length > 100) data.chatHistory = data.chatHistory.slice(0, 100);
  return message;
}

module.exports = {
  processChatMessage,
  getChatHistory,
  saveChatMessage,
  AGENTS
};