// Revenue Intelligence Engine v2.0
// Predictive analytics, deal scoring, churn prediction, smart alerts
const crypto = require('crypto');

class RevenueIntelligence {
  constructor() {
    this.models = {
      dealScoring: this.trainDealScoringModel(),
      churnPrediction: this.trainChurnModel(),
      revenueForecasting: this.trainForecastModel(),
      leadScoring: this.trainLeadScoringModel()
    };
  }

  trainDealScoringModel() {
    return {
      weights: { dealAmount: 0.25, stage: 0.20, engagement: 0.20, decisionTimeline: 0.15, competitorPresence: 0.10, historicalWinRate: 0.10 },
      stageScores: { 'negotiation': 0.9, 'proposal': 0.7, 'discovery': 0.4, 'qualified': 0.3, 'lead': 0.1 }
    };
  }

  trainChurnModel() {
    return {
      weights: { usageDecline: 0.30, sentimentDrop: 0.25, supportTickets: 0.20, npsScore: 0.15, competitorActivity: 0.10 },
      thresholds: { highRisk: 0.7, mediumRisk: 0.4 }
    };
  }

  trainForecastModel() {
    return {
      weights: { historicalTrend: 0.35, pipelineCoverage: 0.25, seasonalFactor: 0.20, marketConditions: 0.20 },
      confidenceThresholds: { high: 0.8, medium: 0.5 }
    };
  }

  trainLeadScoringModel() {
    return {
      weights: { engagement: 0.30, companyFit: 0.25, budget: 0.20, timeline: 0.15, source: 0.10 },
      sourceScores: { 'referral': 0.9, 'organic': 0.7, 'paid': 0.5, 'outbound': 0.3, 'event': 0.6 }
    };
  }

  scoreDeal(deal, data) {
    const model = this.models.dealScoring;
    const amountScore = Math.min(deal.amount || 0, 1000000) / 1000000;
    const stageScore = model.stageScores[deal.stage?.toLowerCase()] || 0.3;
    const engagementScore = (deal.engagement || {}).score || 0.5;
    const timelineScore = deal.urgency === 'hot' ? 1 : deal.urgency === 'warm' ? 0.6 : 0.3;
    const historicalWinRate = data.deals?.filter(d => d.amount > (deal.amount * 0.8) && d.amount < (deal.amount * 1.2)).length > 0 ? 0.35 : 0.5;
    
    const score = (amountScore * model.weights.dealAmount) + (stageScore * model.weights.stage) + 
                  (engagementScore * model.weights.engagement) + (timelineScore * model.weights.decisionTimeline) + 
                  (historicalWinRate * model.weights.historicalWinRate);
    
    return {
      score: Math.round(score * 100),
      label: score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low',
      factors: { amount: amountScore, stage: stageScore, engagement: engagementScore, timeline: timelineScore, historical: historicalWinRate },
      recommendation: score >= 0.7 ? 'Приоритетная сделка — ускорить закрытие' : score >= 0.4 ? 'Требуется дополнительная работа' : 'Низкий приоритет'
    };
  }

  predictChurn(account, data) {
    const model = this.models.churnPrediction;
    const usageDecline = account.usageTrend === 'declining' ? 0.8 : account.usageTrend === 'stable' ? 0.3 : 0.1;
    const sentimentDrop = account.sentiment === 'negative' ? 0.9 : account.sentiment === 'neutral' ? 0.4 : 0.1;
    const supportTickets = Math.min((account.supportTickets || 0) / 20, 1);
    const npsScore = Math.max(0, (100 - (account.nps || 50)) / 100);
    
    const score = (usageDecline * model.weights.usageDecline) + (sentimentDrop * model.weights.sentimentDrop) +
                  (supportTickets * model.weights.supportTickets) + (npsScore * model.weights.npsScore);
    
    return {
      churnProbability: Math.round(score * 100),
      riskLevel: score >= model.thresholds.highRisk ? 'high' : score >= model.thresholds.mediumRisk ? 'medium' : 'low',
      factors: { usageDecline, sentimentDrop, supportTickets, npsScore },
      recommendedActions: score >= 0.7 ? ['Немедленный контакт с клиентом', 'Предложение скидки/бонуса', 'Персональный онбординг'] : 
                          score >= 0.4 ? ['Мониторинг активности', 'Проверка NPS', 'Улучшение поддержки'] : ['Продолжать стандартное обслуживание']
    };
  }

  forecastRevenue(data, period = 'quarter') {
    const model = this.models.revenueForecasting;
    const historicalData = data.metricsHistory || [];
    const pipelineData = data.deals || [];
    
    const historicalTrend = historicalData.length > 0 ? 
      historicalData.reduce((sum, m) => sum + (m.revenue || 0), 0) / historicalData.length : 500000;
    const pipelineCoverage = pipelineData.reduce((sum, d) => sum + (d.amount || 0), 0) * 0.3;
    const seasonalFactor = period === 'quarter' ? 1.1 : period === 'month' ? 0.95 : 1.0;
    
    const forecast = (historicalTrend * model.weights.historicalTrend) + (pipelineCoverage * model.weights.pipelineCoverage) +
                     (historicalTrend * seasonalFactor * model.weights.seasonalFactor);
    
    const confidence = pipelineData.length > 50 ? 0.85 : pipelineData.length > 20 ? 0.7 : 0.5;
    
    return {
      forecast: Math.round(forecast),
      confidence: Math.round(confidence * 100),
      range: { low: Math.round(forecast * 0.8), high: Math.round(forecast * 1.2) },
      period,
      factors: { historicalTrend: Math.round(historicalTrend), pipelineCoverage: Math.round(pipelineCoverage), seasonalFactor }
    };
  }

  scoreLead(lead) {
    const model = this.models.leadScoring;
    const engagementScore = lead.engagement || 0.5;
    const companyFit = lead.companyFit || 0.5;
    const budgetScore = lead.budget ? Math.min(lead.budget / 100000, 1) : 0.3;
    const timelineScore = lead.timeline === 'immediate' ? 1 : lead.timeline === 'short' ? 0.7 : lead.timeline === 'medium' ? 0.4 : 0.2;
    const sourceScore = model.sourceScores[lead.source?.toLowerCase()] || 0.4;
    
    const score = (engagementScore * model.weights.engagement) + (companyFit * model.weights.companyFit) +
                  (budgetScore * model.weights.budget) + (timelineScore * model.weights.timeline) +
                  (sourceScore * model.weights.source);
    
    return {
      score: Math.round(score * 100),
      label: score >= 0.7 ? 'hot' : score >= 0.4 ? 'warm' : 'cold',
      priority: score >= 0.7 ? 'Немедленный контакт' : score >= 0.4 ? 'Запланировать звонок' : 'Добавить в nurture-кампанию'
    };
  }

  getRevenueDashboard(data) {
    const forecast = this.forecastRevenue(data);
    const deals = (data.deals || []).map(d => ({ ...d, scoring: this.scoreDeal(d, data) }));
    const accounts = (data.accounts || []).map(a => ({ ...a, churnRisk: this.predictChurn(a, data) }));
    const leads = (data.leads || []).map(l => ({ ...l, scoring: this.scoreLead(l) }));
    
    const pipelineValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const highValueDeals = deals.filter(d => d.scoring.label === 'high');
    const atRiskAccounts = accounts.filter(a => a.churnRisk.riskLevel === 'high');
    const hotLeads = leads.filter(l => l.scoring.label === 'hot');
    
    return {
      forecast,
      pipeline: { total: pipelineValue, count: deals.length, highValue: highValueDeals.length, highValueAmount: highValueDeals.reduce((s, d) => s + (d.amount || 0), 0) },
      churn: { atRisk: atRiskAccounts.length, total: accounts.length, potentialLoss: atRiskAccounts.reduce((s, a) => s + (a.arr || 0), 0) },
      leads: { hot: hotLeads.length, total: leads.length, conversion: leads.length > 0 ? Math.round((hotLeads.length / leads.length) * 100) : 0 },
      alerts: this.generateAlerts(deals, accounts, forecast)
    };
  }

  generateAlerts(deals, accounts, forecast) {
    const alerts = [];
    const highValueDeals = deals.filter(d => d.scoring?.label === 'high' && d.stage !== 'closed_won');
    if (highValueDeals.length > 0) {
      alerts.push({ type: 'opportunity', severity: 'high', title: `${highValueDeals.length} приоритетных сделок требуют внимания`, value: highValueDeals.reduce((s, d) => s + (d.amount || 0), 0) });
    }
    const atRisk = accounts.filter(a => a.churnRisk?.riskLevel === 'high');
    if (atRisk.length > 0) {
      alerts.push({ type: 'risk', severity: 'high', title: `${atRisk.length} клиентов под угрозой оттока`, value: atRisk.reduce((s, a) => s + (a.arr || 0), 0) });
    }
    if (forecast.confidence < 60) {
      alerts.push({ type: 'warning', severity: 'medium', title: 'Низкая точность прогноза — недостаточно данных в pipeline' });
    }
    return alerts;
  }
}

const revenueIntelligence = new RevenueIntelligence();

function getRevenueDashboard(data) { return revenueIntelligence.getRevenueDashboard(data); }
function scoreDeal(deal, data) { return revenueIntelligence.scoreDeal(deal, data); }
function predictChurn(account, data) { return revenueIntelligence.predictChurn(account, data); }
function forecastRevenue(data, period) { return revenueIntelligence.forecastRevenue(data, period); }
function scoreLead(lead) { return revenueIntelligence.scoreLead(lead); }

module.exports = { getRevenueDashboard, scoreDeal, predictChurn, forecastRevenue, scoreLead, RevenueIntelligence };
