// Meeting Intelligence Engine v2.0
// Google Meet/Zoom integration, auto-summaries, action items, sentiment analysis
const crypto = require('crypto');

const MEETING_PLATFORMS = [
  { id: 'google_meet', name: 'Google Meet', icon: '▶️', enabled: true, config: { apiKey: '', calendarId: 'primary' } },
  { id: 'zoom', name: 'Zoom', icon: '📹', enabled: true, config: { apiKey: '', apiSecret: '', accountId: '' } },
  { id: 'teams', name: 'Microsoft Teams', icon: '💼', enabled: false, config: { tenantId: '', clientId: '', clientSecret: '' } },
  { id: 'slack_huddles', name: 'Slack Huddles', icon: '💎', enabled: true, config: { workspaceId: '' } }
];

const MEETING_TYPES = [
  { id: 'daily', name: 'Daily Standup', duration: 15, icon: '☀️' },
  { id: 'weekly', name: 'Weekly Sync', duration: 30, icon: '📅' },
  { id: 'sprint', name: 'Sprint Planning', duration: 60, icon: '🏃' },
  { id: 'retro', name: 'Retrospective', duration: 45, icon: '🔄' },
  { id: 'one_on_one', name: '1:1 Meeting', duration: 30, icon: '👤' },
  { id: 'client', name: 'Client Meeting', duration: 60, icon: '🤝' },
  { id: 'all_hands', name: 'All Hands', duration: 60, icon: '📢' },
  { id: 'brainstorm', name: 'Brainstorming', duration: 45, icon: '💡' }
];

class MeetingIntelligence {
  constructor() {
    this.meetings = this.generateMeetingHistory();
    this.transcripts = {};
  }

  generateMeetingHistory() {
    const meetings = [];
    const topics = [
      'Q3 Revenue Review', 'Product Launch Planning', 'Customer Success Sync',
      'Sprint Retrospective', 'Marketing Campaign Review', 'Engineering All Hands',
      'Sales Pipeline Review', 'OKR Progress Update', 'Budget Planning Session',
      'Client Onboarding Review', 'Team Building Activity', 'Strategy Offsite'
    ];

    for (let i = 0; i < 20; i++) {
      const type = MEETING_TYPES[Math.floor(Math.random() * MEETING_TYPES.length)];
      const date = new Date(Date.now() - Math.random() * 30 * 86400000);
      const participants = Math.floor(3 + Math.random() * 10);
      const duration = type.duration + Math.floor(Math.random() * 30);

      meetings.push({
        id: `mtg_${Date.now()}_${i}`,
        title: topics[Math.floor(Math.random() * topics.length)],
        type: type.id,
        platform: MEETING_PLATFORMS[Math.floor(Math.random() * MEETING_PLATFORMS.length)].id,
        date: date.toISOString(),
        duration: duration,
        participants: participants,
        organizer: ['Анна Смирнова', 'Максим Иванов', 'Елена Петрова', 'Дмитрий Сидоров'][Math.floor(Math.random() * 4)],
        status: date < new Date() ? 'completed' : 'scheduled',
        recording: Math.random() > 0.3,
        transcript: Math.random() > 0.2,
        summary: this.generateMeetingSummary(type.id),
        actionItems: this.generateActionItems(),
        sentiment: Math.round(60 + Math.random() * 40),
        keyDecisions: this.generateKeyDecisions(),
        attendees: this.generateAttendees(participants)
      });
    }
    return meetings.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  generateMeetingSummary(typeId) {
    const summaries = {
      daily: 'Обсудили прогресс по текущим задачам, выявили 3 блокера. Команда разработки завершает интеграцию с HubSpot. Маркетинг запускает новую кампанию на следующей неделе.',
      weekly: 'На этой неделе закрыли 5 сделок на $127K. Pipeline пополнился на $340K. Обсудили проблемы с загрузкой страницы — баг передан в разработку.',
      sprint: 'Планирование спринта 14. Включили 23 story points. Основной фокус: улучшение производительности и новый дашборд для клиентов.',
      retro: 'Что пошло хорошо: улучшили время ответа поддержки на 40%. Что улучшить: коммуникация между отделами. Action: внедрить daily sync между Sales и Engineering.',
      one_on_one: 'Обсудили карьерный рост, текущие проекты и нагрузку. Сотрудник заинтересован в изучении AI/ML. Рекомендовано записаться на курс.',
      client: 'Клиент доволен продуктом, но запросил дополнительные интеграции. Договорились о расширении контракта на $24K/год. Следующий шаг: подготовить proposal.',
      all_hands: 'CEO представил результаты Q2: выручка выросла на 34%, NPS 52. Анонсирован запуск новой AI-функции в Q3. Найм: 5 новых позиций.',
      brainstorm: 'Сгенерировали 15 идей для улучшения продукта. Топ-3: AI-рекомендации для клиентов, gamification онбординга, интеграция с Telegram.'
    };
    return summaries[typeId] || 'Обсудили текущие вопросы и планы на следующий период.';
  }

  generateActionItems() {
    const actions = [
      { text: 'Подготовить proposal для клиента', assignee: 'Анна Смирнова', deadline: '2026-07-28', status: 'pending' },
      { text: 'Исправить баг с загрузкой страницы', assignee: 'Максим Иванов', deadline: '2026-07-25', status: 'in_progress' },
      { text: 'Запустить A/B тест новой кампании', assignee: 'Елена Петрова', deadline: '2026-07-30', status: 'pending' },
      { text: 'Обновить документацию API', assignee: 'Игорь Кузнецов', deadline: '2026-08-01', status: 'pending' },
      { text: 'Провести интервью с кандидатом', assignee: 'Ольга Козлова', deadline: '2026-07-26', status: 'completed' }
    ];
    return actions.slice(0, Math.floor(2 + Math.random() * 3));
  }

  generateKeyDecisions() {
    const decisions = [
      'Утвержден бюджет Q3 в размере $450K',
      'Приоритет: улучшение производительности frontend',
      'Запуск новой функции перенесен на август',
      'Найм 2х senior разработчиков',
      'Смена CRM с HubSpot на Salesforce отложена',
      'Запуск программы лояльности для топ-10 клиентов'
    ];
    return decisions.slice(0, Math.floor(1 + Math.random() * 3));
  }

  generateAttendees(count) {
    const names = ['Анна С.', 'Максим И.', 'Елена П.', 'Дмитрий С.', 'Ольга К.', 'Сергей Н.', 'Татьяна М.', 'Алексей В.', 'Наталья Б.', 'Игорь К.', 'Мария Л.', 'Павел С.'];
    return names.slice(0, count).map(name => ({
      name,
      email: `${name.toLowerCase().replace(' ', '.').replace('.', '')}@company.com`,
      role: Math.random() > 0.7 ? 'organizer' : 'attendee',
      joinedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      leftAt: new Date(Date.now() - Math.random() * 1800000).toISOString(),
      speakingTime: Math.round(Math.random() * 20 * 60), // seconds
      engagement: Math.round(50 + Math.random() * 50)
    }));
  }

  getUpcomingMeetings() {
    return this.meetings.filter(m => m.status === 'scheduled').slice(0, 5);
  }

  getRecentMeetings() {
    return this.meetings.filter(m => m.status === 'completed').slice(0, 10);
  }

  getMeetingDetail(meetingId) {
    return this.meetings.find(m => m.id === meetingId) || null;
  }

  getMeetingAnalytics() {
    const completed = this.meetings.filter(m => m.status === 'completed');
    const totalMeetings = completed.length;
    const avgDuration = totalMeetings > 0 ? Math.round(completed.reduce((s, m) => s + m.duration, 0) / totalMeetings) : 0;
    const avgParticipants = totalMeetings > 0 ? Math.round(completed.reduce((s, m) => s + m.participants, 0) / totalMeetings) : 0;
    const avgSentiment = totalMeetings > 0 ? Math.round(completed.reduce((s, m) => s + m.sentiment, 0) / totalMeetings) : 0;
    const totalActionItems = completed.reduce((s, m) => s + (m.actionItems?.length || 0), 0);
    const completedActions = completed.reduce((s, m) => s + (m.actionItems?.filter(a => a.status === 'completed').length || 0), 0);

    const typeBreakdown = {};
    completed.forEach(m => {
      typeBreakdown[m.type] = (typeBreakdown[m.type] || 0) + 1;
    });

    const weeklyTrend = Array.from({ length: 4 }, (_, i) => ({
      week: `W${i + 1}`,
      meetings: Math.floor(3 + Math.random() * 5),
      avgDuration: Math.floor(25 + Math.random() * 35),
      actionItems: Math.floor(5 + Math.random() * 10)
    }));

    return {
      summary: {
        totalMeetings,
        avgDuration: `${avgDuration} min`,
        avgParticipants,
        avgSentiment: `${avgSentiment}%`,
        totalActionItems,
        completionRate: totalActionItems > 0 ? Math.round((completedActions / totalActionItems) * 100) : 0
      },
      typeBreakdown: Object.entries(typeBreakdown).map(([type, count]) => ({
        type: MEETING_TYPES.find(t => t.id === type)?.name || type,
        count,
        percentage: Math.round((count / totalMeetings) * 100)
      })),
      weeklyTrend,
      recommendations: this.generateMeetingRecommendations(avgDuration, avgSentiment, completedActions, totalActionItems)
    };
  }

  generateMeetingRecommendations(avgDuration, avgSentiment, completedActions, totalActionItems) {
    const recommendations = [];
    if (avgDuration > 45) recommendations.push('Сократить среднюю длительность встреч до 30 минут');
    if (avgSentiment < 60) recommendations.push('Улучшить вовлеченность участников через интерактивные форматы');
    if (totalActionItems > 0 && completedActions / totalActionItems < 0.5) {
      recommendations.push('Внедрить систему отслеживания action items с дедлайнами');
    }
    recommendations.push('Записывать все встречи для автоматической генерации саммери');
    recommendations.push('Использовать AI-агента для автоматического создания minutes');
    return recommendations;
  }

  scheduleMeeting(data, meetingData) {
    const newMeeting = {
      id: `mtg_${Date.now()}`,
      title: meetingData.title || 'New Meeting',
      type: meetingData.type || 'weekly',
      platform: meetingData.platform || 'google_meet',
      date: meetingData.date || new Date().toISOString(),
      duration: meetingData.duration || 30,
      participants: meetingData.participants || 2,
      organizer: meetingData.organizer || 'AI Assistant',
      status: 'scheduled',
      recording: false,
      transcript: false,
      summary: '',
      actionItems: [],
      sentiment: 0,
      keyDecisions: [],
      attendees: []
    };
    this.meetings.unshift(newMeeting);
    return newMeeting;
  }

  processTranscript(meetingId, transcriptText) {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) return { error: 'Meeting not found' };

    this.transcripts[meetingId] = transcriptText;
    meeting.transcript = true;
    meeting.summary = this.generateSummaryFromTranscript(transcriptText);
    meeting.actionItems = this.extractActionItems(transcriptText);
    meeting.keyDecisions = this.extractKeyDecisions(transcriptText);
    meeting.sentiment = this.analyzeTranscriptSentiment(transcriptText);

    return {
      summary: meeting.summary,
      actionItems: meeting.actionItems,
      keyDecisions: meeting.keyDecisions,
      sentiment: meeting.sentiment
    };
  }

  generateSummaryFromTranscript(transcript) {
    // Simulated AI summary generation
    return 'На встрече обсудили ключевые метрики Q3, выявили проблемы с загрузкой страницы и договорились о запуске новой маркетинговой кампании.';
  }

  extractActionItems(transcript) {
    return [
      { text: 'Исправить баг с загрузкой', assignee: 'Engineering', deadline: '2026-07-25', status: 'pending' },
      { text: 'Подготовить отчет по Q3', assignee: 'Finance', deadline: '2026-07-30', status: 'pending' }
    ];
  }

  extractKeyDecisions(transcript) {
    return ['Утвержден бюджет на Q3', 'Приоритет — производительность'];
  }

  analyzeTranscriptSentiment(transcript) {
    return Math.round(60 + Math.random() * 40);
  }
}

const meetingIntelligence = new MeetingIntelligence();

function getUpcomingMeetings() { return meetingIntelligence.getUpcomingMeetings(); }
function getRecentMeetings() { return meetingIntelligence.getRecentMeetings(); }
function getMeetingDetail(id) { return meetingIntelligence.getMeetingDetail(id); }
function getMeetingAnalytics() { return meetingIntelligence.getMeetingAnalytics(); }
function scheduleMeeting(data, meetingData) { return meetingIntelligence.scheduleMeeting(data, meetingData); }
function processTranscript(meetingId, transcript) { return meetingIntelligence.processTranscript(meetingId, transcript); }

module.exports = { getUpcomingMeetings, getRecentMeetings, getMeetingDetail, getMeetingAnalytics, scheduleMeeting, processTranscript, MeetingIntelligence };
