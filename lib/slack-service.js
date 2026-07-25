const crypto = require('crypto');

const SLACK_CHANNELS = {
  'alerts': 'C0AXIOM01',
  'approvals': 'C0AXIOM02',
  'pulse': 'C0AXIOM03'
};

function sendSlackMessage(channel, blocks) {
  return {
    delivered: true,
    channel,
    ts: new Date().toISOString(),
    blocks,
    message: blocks.map(b => b.text).filter(Boolean).join(' | ')
  };
}

function slackNotifyRisk(data, risk) {
  const notification = {
    id: `slack-risk-${Date.now()}`,
    kind: 'risk',
    title: `🚨 ${risk.title}`,
    detail: risk.detail,
    channel: SLACK_CHANNELS.alerts,
    createdAt: new Date().toISOString()
  };
  data.notifications.unshift(notification);
  return sendSlackMessage(SLACK_CHANNELS.alerts, [
    { type: 'header', text: `🚨 *${risk.title}*` },
    { type: 'section', text: risk.detail },
    { type: 'context', text: `Impact: ${risk.impact} | Detected by ${risk.agent || 'Axiom'}` }
  ]);
}

function slackNotifyApproval(data, item) {
  const notification = {
    id: `slack-approval-${Date.now()}`,
    kind: 'approval',
    title: `✋ Approval needed: ${item.title}`,
    detail: `Review and approve in Axiom. Domain: ${item.domain}`,
    channel: SLACK_CHANNELS.approvals,
    actions: [
      { type: 'button', text: '✅ Approve', actionId: `approve_${item.id}` },
      { type: 'button', text: '🔍 Review', actionId: `review_${item.id}` }
    ],
    createdAt: new Date().toISOString()
  };
  data.notifications.unshift(notification);
  return sendSlackMessage(SLACK_CHANNELS.approvals, [
    { type: 'header', text: `✋ *Approval Required*` },
    { type: 'section', text: `*${item.title}*\nDomain: ${item.domain} | Owner: ${item.owner}` },
    { type: 'actions', elements: notification.actions }
  ]);
}

function slackDailyPulse(data) {
  const activeTasks = data.tasks.filter(t => t.status === 'active').length;
  const pendingApprovals = data.tasks.filter(t => t.lane === 'Needs decision').length;
  const risks = data.notifications.filter(n => n.kind === 'risk').length;
  const pulse = {
    id: `slack-pulse-${Date.now()}`,
    kind: 'pulse',
    title: '📊 Daily Business Pulse',
    detail: `${activeTasks} active tasks · ${pendingApprovals} pending approvals · ${risks} active risks`,
    channel: SLACK_CHANNELS.pulse,
    createdAt: new Date().toISOString()
  };
  data.notifications.unshift(pulse);
  return sendSlackMessage(SLACK_CHANNELS.pulse, [
    { type: 'header', text: '📊 *Daily Business Pulse*' },
    { type: 'section', text: `*Active tasks:* ${activeTasks}\n*Pending approvals:* ${pendingApprovals}\n*Active risks:* ${risks}\n*Revenue:* $842,120\n*Pipeline coverage:* 2.7×` },
    { type: 'context', text: 'Last updated: ' + new Date().toLocaleString() }
  ]);
}

function slackMentionUser(data, userId, message) {
  const notification = {
    id: `slack-mention-${Date.now()}`,
    kind: 'mention',
    title: `@${userId} mentioned in Axiom`,
    detail: message,
    channel: SLACK_CHANNELS.alerts,
    createdAt: new Date().toISOString()
  };
  data.notifications.unshift(notification);
  return sendSlackMessage(SLACK_CHANNELS.alerts, [
    { type: 'section', text: `📢 <@${userId}> ${message}` }
  ]);
}

module.exports = { sendSlackMessage, slackNotifyRisk, slackNotifyApproval, slackDailyPulse, slackMentionUser, SLACK_CHANNELS };