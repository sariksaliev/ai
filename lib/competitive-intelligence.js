// Competitive Intelligence Engine v2.0
// Market monitoring, competitor analysis, web scraping simulation, SWOT analysis
const crypto = require('crypto');

const COMPETITORS = [
  { id: 'comp_glean', name: 'Glean', website: 'glean.com', category: 'enterprise_search', marketShare: 15, funding: '$200M', founded: 2019 },
  { id: 'comp_notion', name: 'Notion AI', website: 'notion.so', category: 'knowledge_mgmt', marketShare: 22, funding: '$275M', founded: 2016 },
  { id: 'comp_motion', name: 'Motion', website: 'usemotion.com', category: 'productivity', marketShare: 8, funding: '$13M', founded: 2020 },
  { id: 'comp_gong', name: 'Gong', website: 'gong.io', category: 'revenue_intelligence', marketShare: 18, funding: '$584M', founded: 2015 },
  { id: 'comp_clari', name: 'Clari', website: 'clari.com', category: 'revenue_forecasting', marketShare: 12, funding: '$496M', founded: 2012 },
  { id: 'comp_chili', name: 'Chili Piper', website: 'chilipiper.com', category: 'scheduling', marketShare: 6, funding: '$17M', founded: 2016 },
  { id: 'comp_outreach', name: 'Outreach', website: 'outreach.io', category: 'sales_engagement', marketShare: 10, funding: '$290M', founded: 2014 },
  { id: 'comp_gainsight', name: 'Gainsight', website: 'gainsight.com', category: 'customer_success', marketShare: 9, funding: '$169M', founded: 2009 }
];

const MARKET_TRENDS = [
  { id: 'trend_1', title: 'Рост AI-агентов в enterprise', description: '68% компаний планируют внедрить AI-агентов до 2026', impact: 'high', category: 'technology' },
  { id: 'trend_2', title: 'Консолидация SaaS-инструментов', description: 'Среднее число SaaS-инструментов на компанию: 130+', impact: 'medium', category: 'market' },
  { id: 'trend_3', title: 'Переход к revenue intelligence', description: 'Рынок revenue intelligence вырастет до $12B к 2027', impact: 'high', category: 'market' },
  { id: 'trend_4', title: 'Автоматизация CRM-процессов', description: '72% задач в CRM будут автоматизированы AI к 2027', impact: 'high', category: 'technology' },
  { id: 'trend_5', title: 'Рост no-code AI платформ', description: 'Рынок no-code AI вырастет до $187B к 2030', impact: 'medium', category: 'technology' },
  { id: 'trend_6', title: 'Появление Business OS категории', description: 'Новая категория на стыке ERP, CRM и AI-агентов', impact: 'high', category: 'market' }
];

const NEWS_SOURCES = [
  { id: 'src_crunchbase', name: 'Crunchbase', type: 'funding', reliability: 0.95 },
  { id: 'src_g2', name: 'G2 Reviews', type: 'reviews', reliability: 0.85 },
  { id: 'src_techcrunch', name: 'TechCrunch', type: 'news', reliability: 0.90 },
  { id: 'src_producthunt', name: 'Product Hunt', type: 'launches', reliability: 0.75 }
];

class CompetitiveIntelligence {
  constructor() {
    this.scrapedData = this.simulateWebScraping();
  }

  simulateWebScraping() {
    return COMPETITORS.map(c => ({
      competitorId: c.id,
      lastScraped: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      sources: NEWS_SOURCES.map(s => ({
        sourceId: s.id,
        articles: this.generateArticles(c, s)
      }))
    }));
  }

  generateArticles(competitor, source) {
    const count = Math.floor(Math.random() * 3) + 1;
    return Array.from({ length: count }, (_, i) => ({
      id: `art_${competitor.id}_${source.id}_${i}`,
      title: this.generateArticleTitle(competitor, source.type),
      snippet: this.generateArticleSnippet(competitor, source.type),
      url: `https://${competitor.website}/news/${i}`,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
      relevance: Math.round(60 + Math.random() * 40)
    }));
  }

  generateArticleTitle(competitor, sourceType) {
    const templates = {
      funding: [
        `${competitor.name} привлек $${Math.floor(Math.random() * 200 + 50)}M в новом раунде`,
        `${competitor.name} закрыл раунд серии ${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}`,
        `Инвесторы оценили ${competitor.name} в $${Math.floor(Math.random() * 5 + 1)}B`
      ],
      reviews: [
        `${competitor.name} — обзор функций и цен 2026`,
        `Сравнение ${competitor.name} с конкурентами: наш вердикт`,
        `${competitor.name}: плюсы и минусы для enterprise`
      ],
      news: [
        `${competitor.name} запускает AI-функцию нового поколения`,
        `${competitor.name} объявил о партнерстве с ${['Microsoft', 'Google', 'Salesforce', 'AWS'][Math.floor(Math.random() * 4)]}`,
        `${competitor.name} расширяется на рынок ${['Европы', 'Азии', 'Латинской Америки'][Math.floor(Math.random() * 3)]}`
      ],
      launches: [
        `${competitor.name} представил ${['Product X', 'AI Studio', 'Enterprise Suite', 'Analytics Pro'][Math.floor(Math.random() * 4)]}`,
        `Новый продукт от ${competitor.name}: что нужно знать`
      ]
    };
    const sourceTemplates = templates[sourceType] || templates.news;
    return sourceTemplates[Math.floor(Math.random() * sourceTemplates.length)];
  }

  generateArticleSnippet(competitor, sourceType) {
    const snippets = {
      funding: `${competitor.name} продолжает агрессивный рост. Инвесторы верят в потенциал компании на рынке ${competitor.category.replace('_', ' ')}.`,
      reviews: `Пользователи отмечают сильные стороны ${competitor.name} в области UX и интеграций, но указывают на высокую стоимость для малого бизнеса.`,
      news: `${competitor.name} укрепляет позиции на рынке. Новые функции направлены на улучшение пользовательского опыта и расширение функциональности.`,
      launches: `Новый продукт от ${competitor.name} может изменить расклад сил на рынке. Эксперты внимательно следят за развитием ситуации.`
    };
    return snippets[sourceType] || snippets.news;
  }

  getCompetitorOverview() {
    return COMPETITORS.map(c => ({
      ...c,
      scrapedData: this.scrapedData.find(sd => sd.competitorId === c.id),
      swot: this.generateSWOT(c),
      threatLevel: this.calculateThreatLevel(c)
    }));
  }

  generateSWOT(competitor) {
    const swotTemplates = {
      glean: { strengths: ['Сильный enterprise search', 'Глубокая интеграция с корп. инструментами'], weaknesses: ['Высокая цена', 'Сложный онбординг'], opportunities: ['Рынок knowledge management растет'], threats: ['Конкуренция с Microsoft', 'Open source альтернативы'] },
      notion: { strengths: ['Сильный бренд', 'Большая пользовательская база'], weaknesses: ['Ограниченная бизнес-аналитика', 'Нет multi-agent системы'], opportunities: ['AI функции расширяют TAM'], threats: ['Coda AI', 'Airtable'] },
      motion: { strengths: ['Умное расписание', 'Приоритизация задач'], weaknesses: ['Только для личной продуктивности', 'Нет B2B аналитики'], opportunities: ['Рынок productivity растет'], threats: ['Google Calendar AI', 'Microsoft Copilot'] },
      gong: { strengths: ['Лидер revenue intelligence', 'Сильная база клиентов enterprise'], weaknesses: ['Дорогой для SMB', 'Сложная настройка'], opportunities: ['Расширение на mid-market'], threats: ['Clari', 'People.ai', 'Axiom OS'] },
      clari: { strengths: ['Точный revenue forecasting', 'Глубокий pipeline analytics'], weaknesses: ['Узкая специализация', 'Нет multi-agent системы'], opportunities: ['Рынок forecasting растет'], threats: ['Gong', 'Axiom OS с multi-agent'] },
      outreach: { strengths: ['Сильный sales engagement', 'Большая экосистема'], weaknesses: ['Только для sales', 'Нет business OS'], opportunities: ['Рынок sales engagement растет'], threats: ['Salesloft', 'Axiom OS'] },
      gainsight: { strengths: ['Лидер customer success', 'Глубокий health scoring'], weaknesses: ['Только для CS', 'Нет AI-агентов'], opportunities: ['Рынок CS растет'], threats: ['Totango', 'ChurnZero', 'Axiom OS'] }
    };
    return swotTemplates[competitor.id] || {
      strengths: ['Стабильный продукт', 'Лояльные клиенты'],
      weaknesses: ['Ограниченная инновационность'],
      opportunities: ['Рынок растет'],
      threats: ['Новые игроки с AI']
    };
  }

  calculateThreatLevel(competitor) {
    const scores = {
      glean: 7, notion: 8, motion: 4, gong: 6, clari: 5, chili: 3, outreach: 6, gainsight: 5
    };
    return { score: scores[competitor.id] || 5, label: (scores[competitor.id] || 5) >= 7 ? 'high' : (scores[competitor.id] || 5) >= 5 ? 'medium' : 'low' };
  }

  getMarketTrends() {
    return MARKET_TRENDS.map(t => ({
      ...t,
      relevanceToAxiom: this.calculateRelevance(t)
    }));
  }

  calculateRelevance(trend) {
    const relevanceMap = {
      'trend_1': { score: 95, reason: 'Прямое совпадение с продуктовой стратегией Axiom OS' },
      'trend_2': { score: 88, reason: 'Axiom OS решает проблему консолидации инструментов' },
      'trend_3': { score: 92, reason: 'Revenue intelligence — ключевая фича Axiom OS' },
      'trend_4': { score: 85, reason: 'AI-агенты Axiom автоматизируют CRM задачи' },
      'trend_5': { score: 90, reason: 'Axiom предоставляет no-code AI агентов' },
      'trend_6': { score: 97, reason: 'Axiom OS — пионер новой категории Business OS' }
    };
    return relevanceMap[trend.id] || { score: 70, reason: 'Умеренная релевантность' };
  }

  getCompetitiveAdvantages() {
    return [
      { category: 'Multi-Agent System', advantage: '6+ AI-агентов, работающих вместе', competitors: 'Glean, Notion, Gong — одиночные AI', impact: 'high' },
      { category: 'Business OS', advantage: 'Единая ОС для управления бизнесом', competitors: 'Разрозненные инструменты (PM + CRM + Analytics)', impact: 'high' },
      { category: 'Execution Engine', advantage: 'AI не только анализирует, но и выполняет', competitors: 'Только аналитика и рекомендации', impact: 'high' },
      { category: 'Zero-Dependency', advantage: 'Работает без внешних зависимостей', competitors: 'Требуют облачные подписки', impact: 'medium' },
      { category: 'Russian Language', advantage: 'Полная поддержка русского языка', competitors: 'В основном English-only', impact: 'medium' },
      { category: 'Marketplace', advantage: 'Маркетплейс готовых AI-сценариев', competitors: 'Закрытые экосистемы', impact: 'high' }
    ];
  }

  getMarketPositioning() {
    const advantages = this.getCompetitiveAdvantages();
    const totalScore = advantages.filter(a => a.impact === 'high').length * 10 + advantages.filter(a => a.impact === 'medium').length * 5;
    return {
      category: 'AI-Powered Business Operating System',
      niche: 'Multi-agent execution platform for SMB and mid-market',
      differentiation: advantages,
      marketFitScore: Math.min(totalScore, 100),
      recommendation: 'Фокусироваться на уникальном преимуществе Multi-Agent Execution Engine'
    };
  }

  getCompetitiveReport(data) {
    return {
      competitors: this.getCompetitorOverview(),
      trends: this.getMarketTrends(),
      positioning: this.getMarketPositioning(),
      alerts: this.generateCompetitiveAlerts()
    };
  }

  generateCompetitiveAlerts() {
    const alerts = [];
    const highThreat = COMPETITORS.filter(c => this.calculateThreatLevel(c).label === 'high');
    if (highThreat.length > 0) {
      alerts.push({ type: 'competitive', severity: 'high', title: `${highThreat.length} конкурентов представляют высокую угрозу`, competitors: highThreat.map(c => c.name) });
    }
    const relevantTrends = MARKET_TRENDS.filter(t => this.calculateRelevance(t).score > 90);
    if (relevantTrends.length > 0) {
      alerts.push({ type: 'opportunity', severity: 'medium', title: `${relevantTrends.length} ключевых трендов совпадают с позиционированием Axiom`, trends: relevantTrends.map(t => t.title) });
    }
    return alerts;
  }
}

const competitiveIntelligence = new CompetitiveIntelligence();

function getCompetitiveReport(data) { return competitiveIntelligence.getCompetitiveReport(data); }
function getCompetitorOverview() { return competitiveIntelligence.getCompetitorOverview(); }
function getMarketTrends() { return competitiveIntelligence.getMarketTrends(); }
function getCompetitiveAdvantages() { return competitiveIntelligence.getCompetitiveAdvantages(); }
function getMarketPositioning() { return competitiveIntelligence.getMarketPositioning(); }

module.exports = { getCompetitiveReport, getCompetitorOverview, getMarketTrends, getCompetitiveAdvantages, getMarketPositioning, CompetitiveIntelligence };
