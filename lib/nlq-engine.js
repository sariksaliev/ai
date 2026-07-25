// Natural Language Query Engine v2.0
// Business questions in natural language, auto-visualization, smart insights
const crypto = require('crypto');

const QUERY_CATEGORIES = [
  { id: 'revenue', name: 'Выручка и финансы', icon: '💰', keywords: ['выручка', 'revenue', 'деньги', 'прибыль', 'profit', 'доход', 'продажи'] },
  { id: 'customers', name: 'Клиенты', icon: '👥', keywords: ['клиент', 'customer', 'пользовател', 'user', 'отток', 'churn', 'nps'] },
  { id: 'pipeline', name: 'Pipeline и сделки', icon: '📊', keywords: ['pipeline', 'сделк', 'deal', 'воронк', 'лид', 'lead', 'конверси'] },
  { id: 'team', name: 'Команда', icon: '👤', keywords: ['сотрудник', 'employee', 'команд', 'team', 'персонал', 'hr', 'найм'] },
  { id: 'product', name: 'Продукт', icon: '🚀', keywords: ['продукт', 'product', 'фича', 'feature', 'разработк', 'engineering'] },
  { id: 'marketing', name: 'Маркетинг', icon: '📣', keywords: ['маркет', 'marketing', 'кампани', 'campaign', 'ads', 'реклам', 'трафик'] },
  { id: 'operations', name: 'Операции', icon: '⚙️', keywords: ['операци', 'operation', 'процесс', 'process', 'sla', 'workflow'] },
  { id: 'general', name: 'Общее', icon: '📋', keywords: [] }
];

const QUERY_TEMPLATES = {
  revenue: [
    { question: 'Какая выручка в этом квартале?', visualization: 'bar', metric: 'revenue' },
    { question: 'Сравни выручку с прошлым месяцем', visualization: 'line', metric: 'revenue_trend' },
    { question: 'Покажи топ-5 клиентов по выручке', visualization: 'table', metric: 'top_customers' },
    { question: 'Какой прогноз выручки на следующий месяц?', visualization: 'gauge', metric: 'forecast' }
  ],
  customers: [
    { question: 'Сколько новых клиентов в этом месяце?', visualization: 'bar', metric: 'new_customers' },
    { question: 'Какие клиенты под риском оттока?', visualization: 'table', metric: 'churn_risk' },
    { question: 'Покажи NPS динамику за год', visualization: 'line', metric: 'nps_trend' },
    { question: 'Какие клиенты с наибольшим потенциалом роста?', visualization: 'table', metric: 'expansion_potential' }
  ],
  pipeline: [
    { question: 'Сколько сделок в pipeline?', visualization: 'funnel', metric: 'pipeline_value' },
    { question: 'Какая конверсия из лида в сделку?', visualization: 'funnel', metric: 'conversion' },
    { question: 'Покажи сделки, которые застряли', visualization: 'table', metric: 'stuck_deals' },
    { question: 'Какой средний чек сделки?', visualization: 'bar', metric: 'avg_deal_size' }
  ],
  team: [
    { question: 'Сколько сотрудников в компании?', visualization: 'bar', metric: 'headcount' },
    { question: 'Какая средняя производительность команды?', visualization: 'gauge', metric: 'productivity' },
    { question: 'Покажи загруженность отделов', visualization: 'bar', metric: 'workload' },
    { question: 'Какие навыки нужны команде?', visualization: 'table', metric: 'skill_gaps' }
  ],
  product: [
    { question: 'Какие фичи в разработке?', visualization: 'table', metric: 'features' },
    { question: 'Сколько багов заведено?', visualization: 'bar', metric: 'bugs' },
    { question: 'Какая скорость разработки?', visualization: 'line', metric: 'velocity' }
  ],
  marketing: [
    { question: 'Какой ROI маркетинга?', visualization: 'gauge', metric: 'roi' },
    { question: 'Какие каналы приносят больше всего лидов?', visualization: 'pie', metric: 'channel_performance' },
    { question: 'Сколько трафика в этом месяце?', visualization: 'line', metric: 'traffic' }
  ],
  operations: [
    { question: 'Какие процессы работают медленно?', visualization: 'table', metric: 'bottlenecks' },
    { question: 'Какой процент SLA выполняется?', visualization: 'gauge', metric: 'sla_compliance' },
    { question: 'Покажи активные workflow', visualization: 'table', metric: 'active_workflows' }
  ]
};

class NLQEngine {
  constructor() {
    this.queryHistory = [];
  }

  classifyQuery(question) {
    const q = question.toLowerCase();
    let bestCategory = 'general';
    let bestScore = 0;

    QUERY_CATEGORIES.forEach(category => {
      const score = category.keywords.reduce((sum, kw) => sum + (q.includes(kw) ? 1 : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category.id;
      }
    });

    return bestCategory;
  }

  findBestTemplate(question, category) {
    const templates = QUERY_TEMPLATES[category] || QUERY_TEMPLATES.general;
    const q = question.toLowerCase();
    
    let bestTemplate = null;
    let bestScore = 0;

    templates.forEach(template => {
      const templateWords = template.question.toLowerCase().split(' ');
      const score = templateWords.reduce((sum, word) => sum + (q.includes(word) ? 1 : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    });

    return bestTemplate || templates[0];
  }

  executeQuery(question, data) {
    const category = this.classifyQuery(question);
    const template = this.findBestTemplate(question, category);
    
    const result = this.generateQueryResult(question, category, template, data);
    
    const queryRecord = {
      id: `query_${Date.now()}`,
      question,
      category,
      timestamp: new Date().toISOString(),
      result
    };
    
    this.queryHistory.unshift(queryRecord);
    return queryRecord;
  }

  generateQueryResult(question, category, template, data) {
    const resultGenerators = {
      revenue: () => this.generateRevenueResult(data),
      customers: () => this.generateCustomerResult(data),
      pipeline: () => this.generatePipelineResult(data),
      team: () => this.generateTeamResult(data),
      product: () => this.generateProductResult(data),
      marketing: () => this.generateMarketingResult(data),
      operations: () => this.generateOperationsResult(data),
      general: () => this.generateGeneralResult(data)
    };

    const generator = resultGenerators[category] || resultGenerators.general;
    const queryResult = generator();

    return {
      question,
      category: QUERY_CATEGORIES.find(c => c.id === category)?.name || 'Общее',
      visualization: template?.visualization || 'table',
      metric: template?.metric || 'general',
      data: queryResult.data,
      summary: queryResult.summary,
      insight: queryResult.insight,
      confidence: Math.round(75 + Math.random() * 20),
      timestamp: new Date().toISOString()
    };
  }

  generateRevenueResult(data) {
    const revenue = data.metricsHistory?.[0]?.revenue || 842000;
    const forecast = data.forecast || { value: 920000, confidence: 85 };
    return {
      data: {
        currentRevenue: revenue,
        forecast: forecast.value,
        growth: '+12.3%',
        topCustomers: [
          { name: 'Acme Corp', revenue: 124000, growth: '+18%' },
          { name: 'GlobalTech', revenue: 98000, growth: '+7%' },
          { name: 'StartupX', revenue: 87000, growth: '+24%' },
          { name: 'Enterprise Inc', revenue: 76000, growth: '-3%' },
          { name: 'MidMarket Co', revenue: 65000, growth: '+11%' }
        ],
        monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(2026, i, 1).toLocaleString('ru', { month: 'short' }),
          value: Math.round(700000 + Math.random() * 200000)
        }))
      },
      summary: `Текущая выручка: $${(revenue / 1000).toFixed(0)}K. Прогноз на Q3: $${(forecast.value / 1000).toFixed(0)}K. Рост: 12.3% к прошлому кварталу.`,
      insight: 'Основной драйвер роста — expansion revenue от топ-3 клиентов. Рекомендуется усилить программу upsell.'
    };
  }

  generateCustomerResult(data) {
    return {
      data: {
        totalCustomers: 142,
        newThisMonth: 8,
        churnRate: '4.2%',
        nps: 52,
        atRisk: [
          { name: 'Enterprise Inc', risk: 'high', arr: 76000, reason: 'Usage decline' },
          { name: 'TechStart', risk: 'high', arr: 34000, reason: 'Support tickets spike' },
          { name: 'DataFlow', risk: 'medium', arr: 28000, reason: 'NPS drop' }
        ],
        npsHistory: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2026, i, 1).toLocaleString('ru', { month: 'short' }),
          value: Math.round(30 + Math.random() * 40)
        }))
      },
      summary: '142 активных клиента. NPS: 52 (good). 3 клиента под риском оттока на $138K ARR.',
      insight: 'Enterprise Inc показывает снижение usage на 34% — требуется немедленный контакт.'
    };
  }

  generatePipelineResult(data) {
    return {
      data: {
        totalDeals: 312,
        pipelineValue: 2840000,
        avgDealSize: 9100,
        conversionRate: '24%',
        stuckDeals: [
          { name: 'Acme Corp Enterprise', amount: 120000, stage: 'negotiation', daysStuck: 14 },
          { name: 'GlobalTech Expansion', amount: 85000, stage: 'proposal', daysStuck: 10 },
          { name: 'StartupX Annual', amount: 45000, stage: 'discovery', daysStuck: 21 }
        ],
        funnel: [
          { stage: 'Lead', count: 1200, value: 0 },
          { stage: 'Qualified', count: 450, value: 900000 },
          { stage: 'Discovery', count: 200, value: 1200000 },
          { stage: 'Proposal', count: 80, value: 1600000 },
          { stage: 'Negotiation', count: 32, value: 2840000 }
        ]
      },
      summary: '312 сделок в pipeline на $2.84M. Конверсия: 24%. 3 сделки застряли на 10+ дней.',
      insight: 'Сделка Acme Corp на $120K застряла на negotiation — требуется executive involvement.'
    };
  }

  generateTeamResult(data) {
    return {
      data: {
        totalEmployees: 48,
        departments: [
          { name: 'Продажи', count: 12, avgPerformance: 78 },
          { name: 'Маркетинг', count: 8, avgPerformance: 72 },
          { name: 'Разработка', count: 15, avgPerformance: 85 },
          { name: 'Поддержка', count: 6, avgPerformance: 70 },
          { name: 'Финансы', count: 4, avgPerformance: 82 },
          { name: 'HR', count: 3, avgPerformance: 75 }
        ],
        avgProductivity: 76,
        avgEngagement: 68,
        skillGaps: ['Cloud Architecture', 'Data Analysis', 'AI/ML']
      },
      summary: '48 сотрудников в 6 отделах. Средняя производительность: 76%. Вовлеченность: 68%.',
      insight: 'Отдел разработки показывает highest performance (85%). Ключевые skill gaps: Cloud Architecture, Data Analysis.'
    };
  }

  generateProductResult(data) {
    return {
      data: {
        activeFeatures: 24,
        inDevelopment: 5,
        bugsOpen: 18,
        bugsResolvedThisMonth: 32,
        velocity: 42,
        topFeatures: [
          { name: 'AI Chat', usage: '87%', satisfaction: 4.5 },
          { name: 'Revenue Dashboard', usage: '92%', satisfaction: 4.2 },
          { name: 'Auto Actions', usage: '65%', satisfaction: 4.0 },
          { name: 'Risk Register', usage: '58%', satisfaction: 3.8 }
        ]
      },
      summary: '24 активных фичи, 5 в разработке. 18 открытых багов. Velocity: 42 story points/спринт.',
      insight: 'AI Chat — самая используемая фича (87%). Risk Register требует улучшения UX.'
    };
  }

  generateMarketingResult(data) {
    return {
      data: {
        totalCampaigns: 12,
        activeCampaigns: 5,
        monthlyTraffic: 45200,
        leadsGenerated: 380,
        costPerLead: 42,
        roi: '285%',
        channelBreakdown: [
          { channel: 'Google Ads', leads: 145, cost: 5800, roi: '320%' },
          { channel: 'LinkedIn', leads: 98, cost: 4200, roi: '240%' },
          { channel: 'Organic', leads: 87, cost: 0, roi: '∞' },
          { channel: 'Email', leads: 50, cost: 1200, roi: '180%' }
        ]
      },
      summary: '5 активных кампаний. 45.2K трафика/мес. 380 лидов. ROI: 285%. CPL: $42.',
      insight: 'Google Ads — самый эффективный канал (320% ROI). Organic трафик растет на 15% месяц к месяцу.'
    };
  }

  generateOperationsResult(data) {
    return {
      data: {
        slaCompliance: '94%',
        avgResponseTime: '2.4 hours',
        activeWorkflows: 8,
        bottlenecks: [
          { process: 'Security Review', delay: '4 days', impact: 'high' },
          { process: 'Customer Onboarding', delay: '2 days', impact: 'medium' },
          { process: 'Invoice Processing', delay: '1 day', impact: 'low' }
        ],
        workflowBreakdown: [
          { type: 'Automated', count: 5, efficiency: '92%' },
          { type: 'Manual', count: 3, efficiency: '65%' }
        ]
      },
      summary: 'SLA compliance: 94%. Среднее время ответа: 2.4 часа. 8 активных workflow.',
      insight: 'Security Review — главный bottleneck (4 дня задержки). Рекомендуется автоматизация.'
    };
  }

  generateGeneralResult(data) {
    return {
      data: {
        companyHealth: 'Good',
        activeAlerts: 3,
        pendingActions: 12,
        weeklyChange: '+5.2%',
        quickStats: {
          revenue: '$842K',
          customers: 142,
          deals: 312,
          employees: 48,
          nps: 52
        }
      },
      summary: 'Компания в хорошем состоянии. 3 активных алерта. 12 pending действий. Недельный рост: +5.2%.',
      insight: 'Все ключевые метрики в зеленой зоне. Рекомендуется мониторинг оттока клиентов.'
    };
  }

  getQueryHistory() {
    return this.queryHistory.slice(0, 20);
  }

  getSuggestedQueries() {
    return [
      'Какая выручка в этом квартале?',
      'Какие клиенты под риском оттока?',
      'Сколько сделок в pipeline?',
      'Какая производительность команды?',
      'Какой ROI маркетинга?',
      'Покажи NPS динамику'
    ];
  }
}

const nlqEngine = new NLQEngine();

function executeQuery(question, data) { return nlqEngine.executeQuery(question, data); }
function getQueryHistory() { return nlqEngine.getQueryHistory(); }
function getSuggestedQueries() { return nlqEngine.getSuggestedQueries(); }
function classifyQuery(question) { return nlqEngine.classifyQuery(question); }

module.exports = { executeQuery, getQueryHistory, getSuggestedQueries, classifyQuery, NLQEngine };
