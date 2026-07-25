// Smart Notification Engine v2.0
// Multi-channel notifications (Telegram, WhatsApp, Email, Slack, SMS)
const crypto = require('crypto');

const CHANNELS = {
  telegram: { name: 'Telegram', icon: '✈️', enabled: false, config: { botToken: '', chatId: '' } },
  whatsapp: { name: 'WhatsApp', icon: '💬', enabled: false, config: { apiKey: '', phoneNumber: '' } },
  email: { name: 'Email', icon: '📧', enabled: true, config: { smtpHost: '', smtpPort: 587, username: '', password: '' } },
  slack: { name: 'Slack', icon: '💎', enabled: true, config: { webhookUrl: '', channel: '#alerts' } },
  sms: { name: 'SMS', icon: '📱', enabled: false, config: { twilioSid: '', twilioToken: '', fromNumber: '' } }
};

const NOTIFICATION_TEMPLATES = {
  deal_won: { title: '🎉 Сделка закрыта!', priority: 'high', channels: ['slack', 'telegram'] },
  deal_lost: { title: '❌ Сделка проиграна', priority: 'medium', channels: ['slack', 'email'] },
  churn_risk: { title: '🚨 Риск оттока клиента', priority: 'high', channels: ['slack', 'telegram', 'email'] },
  forecast_update: { title: '📊 Обновление прогноза', priority: 'medium', channels: ['slack', 'email'] },
  weekly_report: { title: '📈 Еженедельный отчет', priority: 'low', channels: ['email'] },
  anomaly_detected: { title: '⚠️ Аномалия в данных', priority: 'high', channels: ['slack', 'telegram', 'sms'] },
  approval_required: { title: '✅ Требуется одобрение', priority: 'high', channels: ['slack', 'telegram', 'email'] },
  sla_breach: { title: '⏰ Нарушение SLA', priority: 'critical', channels: ['slack', 'telegram', 'sms', 'email'] },
  agent_insight: { title: '🤖 Инсайт от AI-агента', priority: 'low', channels: ['slack'] },
  daily_brief: { title: '☀️ Утренний брифинг', priority: 'medium', channels: ['email', 'slack'] }
};

function getNotificationChannels() {
  return Object.entries(CHANNELS).map(([id, channel]) => ({
    id,
    name: channel.name,
    icon: channel.icon,
    enabled: channel.enabled,
    config: channel.config
  }));
}

function updateChannelConfig(channelId, config) {
  if (!CHANNELS[channelId]) return { error: 'Channel not found' };
  CHANNELS[channelId].enabled = config.enabled !== undefined ? config.enabled : CHANNELS[channelId].enabled;
  if (config.config) Object.assign(CHANNELS[channelId].config, config.config);
  return { success: true, channel: CHANNELS[channelId] };
}

function sendNotification(type, data, customChannels) {
  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) return { error: 'Unknown notification type' };
  
  const channels = customChannels || template.channels;
  const results = [];
  
  channels.forEach(channelId => {
    const channel = CHANNELS[channelId];
    if (!channel || !channel.enabled) {
      results.push({ channel: channelId, status: 'skipped', reason: 'Channel not configured' });
      return;
    }
    
    const message = formatMessage(type, data);
    const notification = {
      id: `notif_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
      type,
      channel: channelId,
      title: template.title,
      message,
      priority: template.priority,
      data,
      sentAt: new Date().toISOString(),
      status: 'sent',
      read: false
    };
    
    results.push({ channel: channelId, status: 'sent', notificationId: notification.id, message });
  });
  
  return { results, timestamp: new Date().toISOString() };
}

function formatMessage(type, data) {
  const formatters = {
    deal_won: () => `Сделка "${data.dealName}" на $${data.amount?.toLocaleString()} закрыта! Ответственный: ${data.owner}`,
    deal_lost: () => `Сделка "${data.dealName}" на $${data.amount?.toLocaleString()} проиграна. Причина: ${data.reason || 'Не указана'}`,
    churn_risk: () => `Клиент "${data.companyName}" (ARR: $${data.arr?.toLocaleString()}) под риском оттока. Вероятность: ${data.probability}%. Рекомендуемые действия: ${data.actions?.join(', ')}`,
    forecast_update: () => `Прогноз выручки обновлен: $${data.forecast?.toLocaleString()} (±${data.range || '10%'}). Точность: ${data.confidence}%`,
    weekly_report: () => `Еженедельный отчет готов: Выручка: $${data.revenue?.toLocaleString()}, Сделок: ${data.deals}, Новых лидов: ${data.leads}`,
    anomaly_detected: () => `Обнаружена аномалия: ${data.metric} — ${data.description}. Отклонение: ${data.deviation}%`,
    approval_required: () => `Требуется одобрение: ${data.title}. Инициатор: ${data.initiator}. ${data.url ? `Ссылка: ${data.url}` : ''}`,
    sla_breach: () => `⚠️ КРИТИЧЕСКОЕ НАРУШЕНИЕ SLA: ${data.service} — ${data.description}. Время превышения: ${data.overage}`,
    agent_insight: () => `🤖 ${data.agentName}: ${data.insight}`,
    daily_brief: () => `☀️ Доброе утро! Ваш брифинг: ${data.summary}. Ключевые метрики: ${data.metrics}`
  };
  
  return (formatters[type] || (() => `Уведомление: ${JSON.stringify(data)}`))(data);
}

function getNotificationHistory(data) {
  return data.notifications || [];
}

function markAsRead(data, notificationId) {
  const notif = data.notifications?.find(n => n.id === notificationId);
  if (notif) notif.read = true;
  return notif;
}

function sendDailyBrief(data) {
  const metrics = data.metricsHistory?.[0] || {};
  const deals = data.deals || [];
  const activeWorkflows = data.workflows?.filter(w => w.status === 'active') || [];
  
  const briefData = {
    summary: `Сегодня ${deals.length} активных сделок, ${activeWorkflows.length} рабочих процессов`,
    metrics: `Выручка: $${(metrics.revenue || 0).toLocaleString()}, Pipeline: $${deals.reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()}`
  };
  
  return sendNotification('daily_brief', briefData);
}

module.exports = { 
  getNotificationChannels, updateChannelConfig, sendNotification, 
  getNotificationHistory, markAsRead, sendDailyBrief, NOTIFICATION_TEMPLATES, CHANNELS 
};
