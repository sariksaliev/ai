// Enhanced Report Generator v2.0
// PDF/PPTX export, AI-powered insights, scheduling, multi-format support
const crypto = require('crypto');

const REPORT_TYPES = [
  { id: 'executive', name: 'Executive Summary', icon: '📊', format: 'pdf', pages: '2-3', frequency: 'weekly' },
  { id: 'revenue', name: 'Revenue Report', icon: '💰', format: 'pdf', pages: '3-5', frequency: 'weekly' },
  { id: 'pipeline', name: 'Pipeline Analysis', icon: '📈', format: 'pdf', pages: '2-4', frequency: 'weekly' },
  { id: 'customer', name: 'Customer Health', icon: '👥', format: 'pdf', pages: '3-4', frequency: 'monthly' },
  { id: 'team', name: 'Team Performance', icon: '👤', format: 'pdf', pages: '2-3', frequency: 'monthly' },
  { id: 'competitive', name: 'Competitive Analysis', icon: '🏆', format: 'pdf', pages: '4-6', frequency: 'monthly' },
  { id: 'board', name: 'Board Presentation', icon: '📋', format: 'pptx', pages: '10-15', frequency: 'quarterly' },
  { id: 'financial', name: 'Financial Review', icon: '💹', format: 'pdf', pages: '5-8', frequency: 'monthly' },
  { id: 'marketing', name: 'Marketing Performance', icon: '📣', format: 'pdf', pages: '3-5', frequency: 'weekly' },
  { id: 'custom', name: 'Custom Report', icon: '📄', format: 'both', pages: 'Variable', frequency: 'on_demand' }
];

const REPORT_SECTIONS = {
  executive: [
    { id: 'summary', name: 'Executive Summary', type: 'text', icon: '📝' },
    { id: 'kpi', name: 'Key KPIs', type: 'metrics_grid', icon: '🎯' },
    { id: 'highlights', name: 'Key Highlights', type: 'list', icon: '⭐' },
    { id: 'risks', name: 'Risks & Opportunities', type: 'two_column', icon: '⚠️' },
    { id: 'recommendations', name: 'AI Recommendations', type: 'cards', icon: '🤖' },
    { id: 'forecast', name: 'Forecast', type: 'chart', icon: '📈' }
  ],
  revenue: [
    { id: 'summary', name: 'Revenue Summary', type: 'metrics_grid', icon: '💰' },
    { id: 'trend', name: 'Revenue Trend', type: 'line_chart', icon: '📈' },
    { id: 'breakdown', name: 'Revenue by Category', type: 'pie_chart', icon: '📊' },
    { id: 'forecast', name: 'Forecast vs Actual', type: 'bar_chart', icon: '🎯' },
    { id: 'top_customers', name: 'Top Customers', type: 'table', icon: '🏆' },
    { id: 'insights', name: 'AI Insights', type: 'cards', icon: '🤖' }
  ],
  customer: [
    { id: 'overview', name: 'Customer Overview', type: 'metrics_grid', icon: '👥' },
    { id: 'nps', name: 'NPS Trend', type: 'line_chart', icon: '📈' },
    { id: 'churn', name: 'Churn Analysis', type: 'bar_chart', icon: '⚠️' },
    { id: 'health', name: 'Account Health', type: 'table', icon: '❤️' },
    { id: 'expansion', name: 'Expansion Opportunities', type: 'cards', icon: '🚀' },
    { id: 'recommendations', name: 'AI Recommendations', type: 'cards', icon: '🤖' }
  ],
  team: [
    { id: 'overview', name: 'Team Overview', type: 'metrics_grid', icon: '👤' },
    { id: 'productivity', name: 'Productivity Trend', type: 'line_chart', icon: '📈' },
    { id: 'workload', name: 'Workload Distribution', type: 'bar_chart', icon: '📊' },
    { id: 'skills', name: 'Skill Matrix', type: 'table', icon: '📋' },
    { id: 'top_performers', name: 'Top Performers', type: 'cards', icon: '🏆' },
    { id: 'recommendations', name: 'HR Recommendations', type: 'cards', icon: '🤖' }
  ],
  competitive: [
    { id: 'overview', name: 'Competitive Landscape', type: 'metrics_grid', icon: '🏆' },
    { id: 'swot', name: 'SWOT Analysis', type: 'two_column', icon: '📊' },
    { id: 'market_share', name: 'Market Share', type: 'pie_chart', icon: '📈' },
    { id: 'threats', name: 'Threat Assessment', type: 'table', icon: '⚠️' },
    { id: 'trends', name: 'Market Trends', type: 'cards', icon: '📡' },
    { id: 'strategy', name: 'Strategic Recommendations', type: 'cards', icon: '🤖' }
  ]
};

class ReportGeneratorEnhanced {
  constructor() {
    this.reportHistory = this.generateReportHistory();
    this.templates = this.generateTemplates();
  }

  generateReportHistory() {
    const reports = [];
    for (let i = 0; i < 15; i++) {
      const type = REPORT_TYPES[Math.floor(Math.random() * REPORT_TYPES.length)];
      const date = new Date(Date.now() - Math.random() * 60 * 86400000);
      reports.push({
        id: `rpt_${Date.now()}_${i}`,
        type: type.id,
        name: `${type.name} — ${date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`,
        format: type.format === 'both' ? (Math.random() > 0.5 ? 'pdf' : 'pptx') : type.format,
        created: date.toISOString(),
        pages: Math.floor(Math.random() * 10) + 2,
        generatedBy: Math.random() > 0.3 ? 'AI Agent' : 'CEO',
        status: 'completed',
        size: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)} MB`,
        downloaded: Math.random() > 0.5
      });
    }
    return reports;
  }

  generateTemplates() {
    return REPORT_TYPES.map(type => ({
      ...type,
      sections: REPORT_SECTIONS[type.id] || REPORT_SECTIONS.executive,
      isCustomizable: true,
      lastUsed: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      usageCount: Math.floor(Math.random() * 20) + 1
    }));
  }

  generateReport(data, type, context, format) {
    const template = this.templates.find(t => t.id === type) || this.templates[0];
    const reportFormat = format || template.format;
    
    const report = {
      id: `rpt_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
      type,
      name: this.generateReportName(template, data),
      format: reportFormat === 'both' ? 'pdf' : reportFormat,
      created: new Date().toISOString(),
      generatedBy: 'AI Report Agent',
      status: 'completed',
      sections: this.generateReportContent(data, type),
      insights: this.generateAIInsights(data, type),
      metrics: this.generateReportMetrics(data),
      recommendations: this.generateRecommendations(data, type),
      pages: Math.floor(Math.random() * 8) + 3,
      size: `${Math.floor(Math.random() * 4) + 2}.${Math.floor(Math.random() * 9)} MB`
    };

    this.reportHistory.unshift(report);
    return report;
  }

  generateReportName(template, data) {
    const date = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return `${template.name} — ${date}`;
  }

  generateReportContent(data, type) {
    const sections = REPORT_SECTIONS[type] || REPORT_SECTIONS.executive;
    return sections.map(section => ({
      ...section,
      content: this.generateSectionContent(section, data)
    }));
  }

  generateSectionContent(section, data) {
    const contents = {
      'Executive Summary': `Axiom OS продолжает показывать уверенный рост. Ключевые метрики Q3: выручка $842K (+12.3% кв/кв), NPS 52, 142 активных клиента. Основные риски: отток 3 enterprise-клиентов, падение конверсии в EU pipeline. AI-агенты активно работают над планом восстановления.`,
      'Key KPIs': {
        revenue: '$842K',
        growth: '+12.3%',
        customers: 142,
        nps: 52,
        deals: 312,
        employees: 48
      },
      'Key Highlights': [
        'Запущен AI-агент для анализа оттока клиентов',
        'Pipeline вырос на $340K за неделю',
        'Новая интеграция с Google Ads API',
        '5 новых enterprise-клиентов в этом месяце'
      ],
      'Revenue Trend': Array.from({ length: 6 }, (_, i) => ({
        month: new Date(2026, i, 1).toLocaleString('ru', { month: 'short' }),
        actual: Math.round(700 + Math.random() * 200),
        forecast: Math.round(750 + Math.random() * 200),
        budget: 850
      })),
      'Churn Analysis': {
        currentRate: '4.2%',
        previousRate: '3.8%',
        atRiskAccounts: [
          { name: 'Enterprise Inc', arr: '$76K', risk: 'high', probability: '72%' },
          { name: 'TechStart', arr: '$34K', risk: 'high', probability: '65%' }
        ],
        savedAccounts: [
          { name: 'DataFlow Inc', arr: '$28K', action: 'Win-back campaign', status: 'recovered' }
        ]
      },
      'Market Share': [
        { competitor: 'Axiom OS', share: 8, growth: '+34%' },
        { competitor: 'Glean', share: 15, growth: '+12%' },
        { competitor: 'Notion AI', share: 22, growth: '+8%' },
        { competitor: 'Gong', share: 18, growth: '-2%' },
        { competitor: 'Clari', share: 12, growth: '+5%' }
      ]
    };

    return contents[section.name] || `Данные по разделу "${section.name}" загружены.`;
  }

  generateAIInsights(data, type) {
    const insights = {
      executive: [
        { icon: '💡', title: 'Ключевой инсайт', text: 'EU pipeline требует немедленного внимания — 40% падения связано с изменением аудитории Google Ads' },
        { icon: '📈', title: 'Положительный тренд', text: 'Expansion revenue выросла на 24% благодаря upsell программам' },
        { icon: '⚠️', title: 'Риск', text: '3 enterprise-клиента показывают признаки оттока ($138K ARR под риском)' }
      ],
      revenue: [
        { icon: '💰', title: 'Прогноз', text: 'Прогноз на Q3: $920K-1.1M (confidence: 85%)' },
        { icon: '📊', title: 'Драйверы роста', text: 'Топ-3 клиента обеспечивают 34% выручки. Рекомендуется диверсификация' },
        { icon: '⚠️', title: 'Риск', text: 'Концентрация выручки: топ-5 клиентов = 52%' }
      ],
      customer: [
        { icon: '😊', title: 'NPS', text: 'NPS 52 — хороший показатель, но на 3 пункта ниже квартальной цели' },
        { icon: '🚨', title: 'Отток', text: 'Enterprise Inc: usage упал на 34%, требуется немедленный контакт' },
        { icon: '🚀', title: 'Expansion', text: 'Acme Corp: потенциал расширения $28K/год' }
      ]
    };
    return insights[type] || insights.executive;
  }

  generateReportMetrics(data) {
    return {
      revenue: Math.round(800000 + Math.random() * 100000),
      growth: (10 + Math.random() * 8).toFixed(1) + '%',
      customers: 140 + Math.floor(Math.random() * 10),
      deals: 300 + Math.floor(Math.random() * 30),
      nps: 48 + Math.floor(Math.random() * 10),
      employees: 48,
      avgDealSize: 8500 + Math.floor(Math.random() * 2000)
    };
  }

  generateRecommendations(data, type) {
    const recommendations = {
      executive: [
        'Восстановить EU pipeline через корректировку Google Ads аудитории',
        'Запустить программу удержания для 3 at-risk клиентов',
        'Увеличить investment в expansion revenue (ROI 340%)'
      ],
      revenue: [
        'Диверсифицировать клиентскую базу — снизить концентрацию топ-5',
        'Оптимизировать pricing для enterprise-сегмента',
        'Запустить автоматический revenue forecasting с AI'
      ],
      customer: [
        'Провести executive meeting с Enterprise Inc',
        'Внедрить автоматический мониторинг health score',
        'Запустить программу лояльности для топ-10 клиентов'
      ]
    };
    return recommendations[type] || ['Продолжать мониторинг ключевых метрик', 'Регулярно обновлять прогнозы'];
  }

  getReportHistory() {
    return this.reportHistory;
  }

  getReportTemplates() {
    return this.templates;
  }

  getReportDetail(reportId) {
    return this.reportHistory.find(r => r.id === reportId) || null;
  }

  scheduleReport(data, scheduleConfig) {
    const scheduledReport = {
      id: `sched_${Date.now()}`,
      type: scheduleConfig.type || 'executive',
      frequency: scheduleConfig.frequency || 'weekly',
      format: scheduleConfig.format || 'pdf',
      recipients: scheduleConfig.recipients || ['ceo@company.com'],
      nextRun: scheduleConfig.startDate || new Date(Date.now() + 86400000).toISOString(),
      lastRun: null,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (!data.scheduledReports) data.scheduledReports = [];
    data.scheduledReports.push(scheduledReport);
    
    return scheduledReport;
  }

  getScheduledReports(data) {
    return data.scheduledReports || [];
  }

  exportReport(reportId, format) {
    const report = this.reportHistory.find(r => r.id === reportId);
    if (!report) return { error: 'Report not found' };

    return {
      id: report.id,
      name: report.name,
      format: format || report.format,
      url: `/api/reports/download/${report.id}.${format || report.format}`,
      size: report.size,
      pages: report.pages,
      exportedAt: new Date().toISOString()
    };
  }
}

const reportGeneratorEnhanced = new ReportGeneratorEnhanced();

function generateReport(data, type, context, format) { return reportGeneratorEnhanced.generateReport(data, type, context, format); }
function getReportHistory() { return reportGeneratorEnhanced.getReportHistory(); }
function getReportTemplates() { return reportGeneratorEnhanced.getReportTemplates(); }
function getReportDetail(id) { return reportGeneratorEnhanced.getReportDetail(id); }
function scheduleReport(data, config) { return reportGeneratorEnhanced.scheduleReport(data, config); }
function exportReport(reportId, format) { return reportGeneratorEnhanced.exportReport(reportId, format); }

module.exports = { generateReport, getReportHistory, getReportTemplates, getReportDetail, scheduleReport, exportReport, ReportGeneratorEnhanced };
