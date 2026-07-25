// Customer Sentiment Analysis Engine v2.0
// NPS tracking, CSAT scoring, emotional analysis, trend detection, recommendations
const crypto = require('crypto');

const SENTIMENT_CATEGORIES = {
  positive: { score: 1.0, label: 'Позитивный', color: '#22c55e', emoji: '😊' },
  neutral: { score: 0.5, label: 'Нейтральный', color: '#f59e0b', emoji: '😐' },
  negative: { score: 0.0, label: 'Негативный', color: '#ef4444', emoji: '😞' }
};

const SURVEY_TEMPLATES = {
  nps: {
    id: 'survey_nps',
    name: 'NPS Survey',
    question: 'Насколько вероятно, что вы порекомендуете наш продукт коллеге?',
    scale: '0-10',
    categories: { promoters: '9-10', passives: '7-8', detractors: '0-6' }
  },
  csat: {
    id: 'survey_csat',
    name: 'CSAT Survey',
    question: 'Как вы оцениваете качество нашего обслуживания?',
    scale: '1-5',
    categories: { satisfied: '4-5', neutral: '3', dissatisfied: '1-2' }
  },
  ces: {
    id: 'survey_ces',
    name: 'Customer Effort Score',
    question: 'Насколько легко было решить ваш вопрос?',
    scale: '1-7',
    categories: { lowEffort: '1-2', medium: '3-5', highEffort: '6-7' }
  }
};

const SUPPORT_TICKET_SENTIMENTS = [
  { keyword: 'отличный', sentiment: 'positive', intensity: 0.9 },
  { keyword: 'спасибо', sentiment: 'positive', intensity: 0.8 },
  { keyword: 'превосходно', sentiment: 'positive', intensity: 0.95 },
  { keyword: 'помогло', sentiment: 'positive', intensity: 0.7 },
  { keyword: 'удобно', sentiment: 'positive', intensity: 0.6 },
  { keyword: 'быстро', sentiment: 'positive', intensity: 0.7 },
  { keyword: 'ужасно', sentiment: 'negative', intensity: 0.9 },
  { keyword: 'разочарован', sentiment: 'negative', intensity: 0.85 },
  { keyword: 'не работает', sentiment: 'negative', intensity: 0.8 },
  { keyword: 'проблема', sentiment: 'negative', intensity: 0.7 },
  { keyword: 'сложно', sentiment: 'negative', intensity: 0.6 },
  { keyword: 'медленно', sentiment: 'negative', intensity: 0.6 },
  { keyword: 'ок', sentiment: 'neutral', intensity: 0.5 },
  { keyword: 'нормально', sentiment: 'neutral', intensity: 0.4 },
  { keyword: 'приемлемо', sentiment: 'neutral', intensity: 0.3 }
];

class SentimentAnalysis {
  constructor() {
    this.npsHistory = this.generateNPSHistory();
    this.csatHistory = this.generateCSATHistory();
  }

  generateNPSHistory() {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2026, i, 1).toISOString(),
      score: Math.round(30 + Math.random() * 40 + Math.sin(i / 2) * 15),
      responses: Math.floor(100 + Math.random() * 200),
      promoters: Math.floor(30 + Math.random() * 40),
      passives: Math.floor(20 + Math.random() * 30),
      detractors: Math.floor(10 + Math.random() * 30)
    }));
  }

  generateCSATHistory() {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2026, i, 1).toISOString(),
      score: Math.round(3.5 + Math.random() * 1.5),
      responses: Math.floor(50 + Math.random() * 100)
    }));
  }

  analyzeText(text) {
    const words = text.toLowerCase().split(/\s+/);
    let totalScore = 0;
    let matchedKeywords = 0;
    const matchedTerms = [];

    words.forEach(word => {
      const match = SUPPORT_TICKET_SENTIMENTS.find(s => word.includes(s.keyword));
      if (match) {
        totalScore += match.sentiment === 'positive' ? match.intensity : 
                     match.sentiment === 'negative' ? -match.intensity : 0;
        matchedKeywords++;
        matchedTerms.push(match);
      }
    });

    const avgScore = matchedKeywords > 0 ? totalScore / matchedKeywords : 0;
    const normalizedScore = (avgScore + 1) / 2; // Normalize to 0-1

    return {
      score: Math.round(normalizedScore * 100),
      label: normalizedScore >= 0.6 ? 'positive' : normalizedScore >= 0.4 ? 'neutral' : 'negative',
      emoji: normalizedScore >= 0.6 ? '😊' : normalizedScore >= 0.4 ? '😐' : '😞',
      confidence: Math.round(matchedKeywords > 0 ? Math.min(50 + matchedKeywords * 10, 95) : 20),
      matchedTerms: matchedTerms.map(m => m.keyword),
      detail: normalizedScore >= 0.6 ? 'Клиент доволен обслуживанием' : 
              normalizedScore >= 0.4 ? 'Нейтральный отзыв' : 'Клиент недоволен, требуется внимание'
    };
  }

  getNPSData() {
    const latest = this.npsHistory[this.npsHistory.length - 1];
    const previous = this.npsHistory[this.npsHistory.length - 2];
    const trend = latest.score - (previous?.score || 0);

    return {
      current: latest.score,
      history: this.npsHistory,
      trend: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      change: Math.abs(trend),
      category: latest.score >= 70 ? 'great' : latest.score >= 50 ? 'good' : latest.score >= 30 ? 'needs_improvement' : 'critical',
      benchmarks: { topQuartile: 72, median: 54, bottomQuartile: 36 },
      responses: latest.responses,
      breakdown: {
        promoters: Math.round((latest.promoters / latest.responses) * 100),
        passives: Math.round((latest.passives / latest.responses) * 100),
        detractors: Math.round((latest.detractors / latest.responses) * 100)
      }
    };
  }

  getCSATData() {
    const latest = this.csatHistory[this.csatHistory.length - 1];
    return {
      current: latest.score,
      history: this.csatHistory,
      trend: this.csatHistory.length > 1 ? 'stable' : 'up',
      benchmark: 4.2,
      responses: latest.responses
    };
  }

  analyzeSupportTickets(tickets) {
    if (!tickets || tickets.length === 0) {
      return this.generateSampleTickets();
    }
    return tickets.map(ticket => ({
      ...ticket,
      sentiment: this.analyzeText(ticket.text || ticket.description || '')
    }));
  }

  generateSampleTickets() {
    const sampleTexts = [
      { text: 'Спасибо за отличную поддержку! Помогли очень быстро.', sentiment: 'positive' },
      { text: 'Проблема решена, но было сложно разобраться самостоятельно', sentiment: 'neutral' },
      { text: 'Ужасно! Функция не работает уже третий день, а поддержка молчит', sentiment: 'negative' },
      { text: 'Новый интерфейс очень удобный, спасибо разработчикам', sentiment: 'positive' },
      { text: 'Медленно загружается, можно оптимизировать', sentiment: 'neutral' },
      { text: 'Разочарован качеством сервиса в этом месяце', sentiment: 'negative' },
      { text: 'Отличный продукт! Используем всей командой', sentiment: 'positive' },
      { text: 'Приемлемо, но есть куда расти', sentiment: 'neutral' }
    ];

    return sampleTexts.map((item, i) => ({
      id: `ticket_${Date.now()}_${i}`,
      customer: ['Acme Corp', 'GlobalTech', 'StartupX', 'Enterprise Inc', 'MidMarket Co'][Math.floor(Math.random() * 5)],
      agent: ['Анна', 'Максим', 'Елена', 'Дмитрий', 'Ольга'][Math.floor(Math.random() * 5)],
      date: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      category: ['Техподдержка', 'Биллинг', 'Функциональность', 'Интеграция', 'Обучение'][Math.floor(Math.random() * 5)],
      priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      status: ['open', 'in_progress', 'resolved', 'closed'][Math.floor(Math.random() * 4)],
      text: item.text,
      sentiment: this.analyzeText(item.text)
    }));
  }

  getSentimentDashboard() {
    const nps = this.getNPSData();
    const csat = this.getCSATData();
    const tickets = this.analyzeSupportTickets();

    const positiveTickets = tickets.filter(t => t.sentiment.label === 'positive');
    const negativeTickets = tickets.filter(t => t.sentiment.label === 'negative');
    const neutralTickets = tickets.filter(t => t.sentiment.label === 'neutral');

    const recommendations = [];
    if (nps.category === 'critical' || nps.category === 'needs_improvement') {
      recommendations.push('Запустить программу Win-Back для detractor-клиентов');
      recommendations.push('Провести глубинные интервью с 10 оттоковыми клиентами');
    }
    if (negativeTickets.length > positiveTickets.length) {
      recommendations.push('Увеличить штат поддержки, время ответа превышает норму');
      recommendations.push('Внедрить AI-ассистента для первой линии поддержки');
    }
    if (tickets.filter(t => t.category === 'Функциональность').length > 3) {
      recommendations.push('Провести product discovery сессию по улучшению UX');
    }

    return {
      nps,
      csat,
      tickets: {
        total: tickets.length,
        positive: positiveTickets.length,
        negative: negativeTickets.length,
        neutral: neutralTickets.length,
        sentimentScore: tickets.length > 0 ? Math.round((positiveTickets.length / tickets.length) * 100) : 0
      },
      recommendations: recommendations.length > 0 ? recommendations : ['Продолжать мониторинг', 'Поддерживать текущий уровень сервиса'],
      alerts: this.generateSentimentAlerts(nps, negativeTickets)
    };
  }

  generateSentimentAlerts(nps, negativeTickets) {
    const alerts = [];
    if (nps.category === 'critical') {
      alerts.push({ type: 'critical', severity: 'high', title: `NPS критически низкий: ${nps.current}`, detail: 'Требуется немедленное вмешательство CEO' });
    }
    if (negativeTickets.length > 5) {
      alerts.push({ type: 'warning', severity: 'medium', title: `Рост негативных обращений: ${negativeTickets.length} за период`, detail: 'Рекомендуется анализ корневых причин' });
    }
    return alerts;
  }
}

const sentimentAnalysis = new SentimentAnalysis();

function getSentimentDashboard() { return sentimentAnalysis.getSentimentDashboard(); }
function analyzeText(text) { return sentimentAnalysis.analyzeText(text); }
function getNPSData() { return sentimentAnalysis.getNPSData(); }
function getCSATData() { return sentimentAnalysis.getCSATData(); }

module.exports = { getSentimentDashboard, analyzeText, getNPSData, getCSATData, SentimentAnalysis };
