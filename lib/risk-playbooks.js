// Risk Mitigation Playbooks Engine v2.0
// Automated response scenarios, playbook execution, incident management
const crypto = require('crypto');

const PLAYBOOK_TEMPLATES = [
  {
    id: 'playbook_churn',
    name: 'Customer Churn Prevention',
    category: 'retention',
    severity: ['high', 'critical'],
    triggers: ['churn_probability > 70%', 'NPS drop > 20 points', 'support_tickets > 10 in 30 days'],
    steps: [
      { order: 1, action: 'Notify CSM и Account Executive', owner: 'Customer Agent', duration: '1 hour', type: 'notification' },
      { order: 2, action: 'Провести анализ корневой причины оттока', owner: 'Customer Agent', duration: '4 hours', type: 'analysis' },
      { order: 3, action: 'Создать план удержания клиента', owner: 'Sales Agent', duration: '8 hours', type: 'create_plan' },
      { order: 4, action: 'Запросить executive meeting с клиентом', owner: 'CEO Agent', duration: '24 hours', type: 'meeting' },
      { order: 5, action: 'Предложить скидку/бонус для удержания', owner: 'Finance Agent', duration: '48 hours', type: 'approval_required' }
    ],
    sla: '72 hours to resolution',
    successCriteria: ['Client agrees to continue contract', 'NPS restored to previous level', 'Usage returns to baseline']
  },
  {
    id: 'playbook_breach',
    name: 'SLA Breach Recovery',
    category: 'operations',
    severity: ['high', 'critical'],
    triggers: ['sla_breach detected', 'response_time > 4 hours', 'uptime < 99.9%'],
    steps: [
      { order: 1, action: 'Автоматическая эскалация инцидента', owner: 'Operations Agent', duration: '5 min', type: 'notification' },
      { order: 2, action: 'Создать incident response команду', owner: 'Operations Agent', duration: '1 hour', type: 'coordination' },
      { order: 3, action: 'Провести root cause analysis', owner: 'Engineering Agent', duration: '4 hours', type: 'analysis' },
      { order: 4, action: 'Развернуть fix/workaround', owner: 'Engineering Agent', duration: '8 hours', type: 'execution' },
      { order: 5, action: 'Уведомить клиентов о постмортеме', owner: 'Customer Agent', duration: '24 hours', type: 'communication' }
    ],
    sla: '24 hours to resolution',
    successCriteria: ['SLA restored', 'Client notified', 'Post-mortem completed']
  },
  {
    id: 'playbook_pipeline',
    name: 'Pipeline Drop Recovery',
    category: 'revenue',
    severity: ['medium', 'high', 'critical'],
    triggers: ['pipeline_value_drop > 30%', 'conversion_rate_drop > 20%', 'deal_stagnation > 14 days'],
    steps: [
      { order: 1, action: 'Анализ источников падения pipeline', owner: 'Marketing Agent', duration: '2 hours', type: 'analysis' },
      { order: 2, action: 'Запустить win-back кампанию для холодных лидов', owner: 'Marketing Agent', duration: '4 hours', type: 'execution' },
      { order: 3, action: 'Провести deal review с Sales командой', owner: 'Sales Agent', duration: '4 hours', type: 'meeting' },
      { order: 4, action: 'Скорректировать прогноз выручки', owner: 'Finance Agent', duration: '2 hours', type: 'update' },
      { order: 5, action: 'Запустить ускоренную обработку лидов', owner: 'Sales Agent', duration: '24 hours', type: 'automation' }
    ],
    sla: '48 hours to recovery',
    successCriteria: ['Pipeline value stabilized', 'New leads being processed', 'Forecast updated']
  },
  {
    id: 'playbook_security',
    name: 'Security Incident Response',
    category: 'compliance',
    severity: ['critical'],
    triggers: ['security_alert', 'unauthorized_access', 'data_breach_detected'],
    steps: [
      { order: 1, action: 'Изолировать затронутую систему', owner: 'Operations Agent', duration: '15 min', type: 'immediate' },
      { order: 2, action: 'Создать security incident report', owner: 'Operations Agent', duration: '1 hour', type: 'documentation' },
      { order: 3, action: 'Уведомить юридический отдел и руководство', owner: 'CEO Agent', duration: '1 hour', type: 'notification' },
      { order: 4, action: 'Провести forensic analysis', owner: 'Engineering Agent', duration: '24 hours', type: 'investigation' },
      { order: 5, action: 'Развернуть патч/исправление уязвимости', owner: 'Engineering Agent', duration: '48 hours', type: 'execution' }
    ],
    sla: '72 hours to resolution',
    successCriteria: ['Security breach contained', 'Forensic report completed', 'Patch deployed']
  },
  {
    id: 'playbook_financial',
    name: 'Financial Risk Management',
    category: 'financial',
    severity: ['medium', 'high', 'critical'],
    triggers: ['burn_rate_increase > 20%', 'runway < 6 months', 'revenue_drop > 25%'],
    steps: [
      { order: 1, action: 'Провести срочный финансовый аудит', owner: 'Finance Agent', duration: '8 hours', type: 'analysis' },
      { order: 2, action: 'Выявить неэффективные расходы', owner: 'Finance Agent', duration: '4 hours', type: 'analysis' },
      { order: 3, action: 'Создать план оптимизации затрат', owner: 'Finance Agent', duration: '8 hours', type: 'create_plan' },
      { order: 4, action: 'Пересмотреть бюджетные приоритеты', owner: 'CEO Agent', duration: '24 hours', type: 'approval_required' },
      { order: 5, action: 'Запустить программу cost savings', owner: 'Operations Agent', duration: '1 week', type: 'execution' }
    ],
    sla: '2 weeks to stabilization',
    successCriteria: ['Runway extended to 12+ months', 'Cost savings identified', 'Budget realigned']
  },
  {
    id: 'playbook_reputation',
    name: 'Reputation Crisis Management',
    category: 'pr',
    severity: ['high', 'critical'],
    triggers: ['negative_social_media_viral', 'bad_press', 'customer_complaint_public'],
    steps: [
      { order: 1, action: 'Мониторинг социальных сетей и СМИ', owner: 'Marketing Agent', duration: '1 hour', type: 'monitoring' },
      { order: 2, action: 'Подготовить официальный ответ/коммюнике', owner: 'CEO Agent', duration: '4 hours', type: 'draft' },
      { order: 3, action: 'Запустить PR-кампанию', owner: 'Marketing Agent', duration: '24 hours', type: 'execution' },
      { order: 4, action: 'Провести внутренние коммуникации', owner: 'HR Agent', duration: '4 hours', type: 'communication' },
      { order: 5, action: 'Внедрить превентивные меры', owner: 'Operations Agent', duration: '1 week', type: 'improvement' }
    ],
    sla: '48 hours to first response',
    successCriteria: ['Negative sentiment decreased', 'Official response published', 'Crisis contained']
  }
];

class RiskPlaybooks {
  constructor() {
    this.activePlaybooks = [];
    this.executionHistory = [];
  }

  getPlaybookTemplates() {
    return PLAYBOOK_TEMPLATES.map(p => ({ ...p, stepsCount: p.steps.length, totalEstimatedTime: this.calculateTotalTime(p.steps) }));
  }

  calculateTotalTime(steps) {
    const timeMap = {};
    steps.forEach(s => {
      const [val, unit] = s.duration.split(' ');
      const hours = unit === 'week' ? parseInt(val) * 168 : unit === 'day' ? parseInt(val) * 24 : unit === 'min' ? parseInt(val) / 60 : parseInt(val);
      timeMap[s.order] = hours;
    });
    return Object.values(timeMap).reduce((sum, h) => sum + h, 0);
  }

  getPlaybookById(id) { return PLAYBOOK_TEMPLATES.find(p => p.id === id) || null; }

  triggerPlaybook(playbookId, context, data) {
    const template = this.getPlaybookById(playbookId);
    if (!template) return { error: 'Playbook not found' };

    const pbId = `pb_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const steps = template.steps.map(s => ({
      ...s, stepId: `step_${Date.now()}_${s.order}`, status: 'pending', startedAt: null, completedAt: null, assignedTo: s.owner, result: null
    }));
    steps[0].status = 'in_progress';
    steps[0].startedAt = new Date().toISOString();

    const playbookInstance = {
      id: pbId, templateId: playbookId, name: template.name, category: template.category,
      severity: template.severity[template.severity.length - 1], context: context || {},
      triggeredBy: context.triggeredBy || 'AI System', triggeredAt: new Date().toISOString(),
      status: 'active', steps, progress: this.calculateProgress(steps),
      sla: template.sla, successCriteria: template.successCriteria
    };

    this.activePlaybooks.push(playbookInstance);
    this.executionHistory.push({ type: 'triggered', playbookId: pbId, name: template.name, timestamp: new Date().toISOString() });

    if (data) {
      this.createActionItems(data, playbookInstance);
      this.createNotifications(data, playbookInstance);
    }
    return playbookInstance;
  }

  calculateProgress(steps) {
    const completed = steps.filter(s => s.status === 'completed').length;
    return steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;
  }

  advanceStep(playbookId, stepId, result, data) {
    const playbook = this.activePlaybooks.find(p => p.id === playbookId);
    if (!playbook) return { error: 'Active playbook not found' };
    const stepIndex = playbook.steps.findIndex(s => s.stepId === stepId);
    if (stepIndex === -1) return { error: 'Step not found' };

    playbook.steps[stepIndex].status = 'completed';
    playbook.steps[stepIndex].completedAt = new Date().toISOString();
    playbook.steps[stepIndex].result = result || { status: 'success' };

    if (stepIndex + 1 < playbook.steps.length) {
      playbook.steps[stepIndex + 1].status = 'in_progress';
      playbook.steps[stepIndex + 1].startedAt = new Date().toISOString();
    }

    const allCompleted = playbook.steps.every(s => s.status === 'completed');
    if (allCompleted) { playbook.status = 'completed'; playbook.completedAt = new Date().toISOString(); }
    playbook.progress = this.calculateProgress(playbook.steps);
    this.executionHistory.push({ type: 'step_completed', playbookId, step: stepIndex + 1, name: playbook.steps[stepIndex].action, timestamp: new Date().toISOString() });
    return playbook;
  }

  failStep(playbookId, stepId, error, data) {
    const playbook = this.activePlaybooks.find(p => p.id === playbookId);
    if (!playbook) return { error: 'Active playbook not found' };
    const step = playbook.steps.find(s => s.stepId === stepId);
    if (!step) return { error: 'Step not found' };
    step.status = 'failed'; step.result = { status: 'failed', error: error || 'Unknown error' };
    playbook.status = 'failed'; playbook.failedAt = new Date().toISOString();
    playbook.failureReason = error || 'Unknown error';
    this.executionHistory.push({ type: 'step_failed', playbookId, step: step.action, error: error || 'Unknown error', timestamp: new Date().toISOString() });
    if (data) {
      data.notifications.unshift({ id: `notice_${Date.now()}`, kind: 'playbook', title: `🚨 Сбой в playbook: ${playbook.name}`, detail: `Шаг "${step.action}" завершился ошибкой: ${error || 'Unknown'}. Требуется ручное вмешательство.`, read: false, createdAt: new Date().toISOString() });
    }
    return playbook;
  }

  getActivePlaybooks() { return this.activePlaybooks.filter(p => p.status === 'active' || p.status === 'failed'); }
  getPlaybookHistory() { return this.executionHistory.slice(-50); }

  getPlaybookStats() {
    const total = this.activePlaybooks.length;
    const active = this.activePlaybooks.filter(p => p.status === 'active').length;
    const completed = this.activePlaybooks.filter(p => p.status === 'completed').length;
    const failed = this.activePlaybooks.filter(p => p.status === 'failed').length;
    return { total, active, completed, failed };
  }

  createActionItems(data, playbook) {
    playbook.steps.forEach(step => {
      if (data.tasks) {
        data.tasks.unshift({ id: `task_${Date.now()}_${step.order}`, lane: step.type === 'immediate' ? 'Urgent' : step.type === 'approval_required' ? 'Needs decision' : 'In progress', domain: playbook.category, title: `[${playbook.name}] ${step.action}`, owner: step.owner, due: step.duration, status: step.status === 'in_progress' ? 'active' : 'pending', playbookId: playbook.id, stepId: step.stepId, createdAt: new Date().toISOString() });
      }
    });
  }

  createNotifications(data, playbook) {
    if (data.notifications) {
      data.notifications.unshift({ id: `notice_${Date.now()}`, kind: 'playbook', title: `🚨 Запущен playbook: ${playbook.name}`, detail: `${playbook.steps.length} шагов. SLA: ${playbook.sla}. Триггер: ${playbook.triggeredBy}`, read: false, createdAt: new Date().toISOString() });
    }
  }
}

const riskPlaybooks = new RiskPlaybooks();
function getPlaybookTemplates() { return riskPlaybooks.getPlaybookTemplates(); }
function getPlaybookById(id) { return riskPlaybooks.getPlaybookById(id); }
function triggerPlaybook(playbookId, context, data) { return riskPlaybooks.triggerPlaybook(playbookId, context, data); }
function advancePlaybookStep(playbookId, stepId, result, data) { return riskPlaybooks.advanceStep(playbookId, stepId, result, data); }
function failPlaybookStep(playbookId, stepId, error, data) { return riskPlaybooks.failStep(playbookId, stepId, error, data); }
function getActivePlaybooks() { return riskPlaybooks.getActivePlaybooks(); }
function getPlaybookStats() { return riskPlaybooks.getPlaybookStats(); }

module.exports = { getPlaybookTemplates, getPlaybookById, triggerPlaybook, advancePlaybookStep, failPlaybookStep, getActivePlaybooks, getPlaybookStats, RiskPlaybooks };
