const crypto = require('crypto');

const ACCOUNTS = [
  { id: 'acc-1', name: 'Acme Corp', plan: 'Enterprise', mrr: 12000, health: 'at_risk', usage: 66, sentiment: 58, nps: 32, renewalDate: '2026-09-15', daysToRenewal: 55, riskFactors: ['Usage decline', 'Support tickets up 40%', 'Champion left company'] },
  { id: 'acc-2', name: 'Globex Inc', plan: 'Enterprise', mrr: 8500, health: 'healthy', usage: 92, sentiment: 88, nps: 72, renewalDate: '2026-11-01', daysToRenewal: 102, riskFactors: [] },
  { id: 'acc-3', name: 'Initech', plan: 'Business', mrr: 4200, health: 'healthy', usage: 88, sentiment: 85, nps: 68, renewalDate: '2026-08-20', daysToRenewal: 29, riskFactors: [] },
  { id: 'acc-4', name: 'Hooli', plan: 'Enterprise', mrr: 15000, health: 'at_risk', usage: 45, sentiment: 42, nps: 24, renewalDate: '2026-10-01', daysToRenewal: 71, riskFactors: ['Product usage dropped 55%', 'Billing dispute open', 'Competitor evaluation in progress'] },
  { id: 'acc-5', name: 'Stark Industries', plan: 'Business', mrr: 6000, health: 'healthy', usage: 95, sentiment: 92, nps: 78, renewalDate: '2026-12-15', daysToRenewal: 146, riskFactors: [] },
  { id: 'acc-6', name: 'Wayne Enterprises', plan: 'Enterprise', mrr: 20000, health: 'warning', usage: 72, sentiment: 65, nps: 48, renewalDate: '2026-07-28', daysToRenewal: 6, riskFactors: ['Renewal approaching', 'Executive sponsor unresponsive'] },
  { id: 'acc-7', name: 'Oscorp', plan: 'Starter', mrr: 2000, health: 'healthy', usage: 90, sentiment: 86, nps: 70, renewalDate: '2026-09-01', daysToRenewal: 41, riskFactors: [] }
];

function getCustomerHealth() {
  const totalMRR = ACCOUNTS.reduce((s, a) => s + a.mrr, 0);
  const atRiskMRR = ACCOUNTS.filter(a => a.health === 'at_risk').reduce((s, a) => s + a.mrr, 0);
  const warningMRR = ACCOUNTS.filter(a => a.health === 'warning').reduce((s, a) => s + a.mrr, 0);
  return {
    summary: {
      totalAccounts: ACCOUNTS.length,
      healthy: ACCOUNTS.filter(a => a.health === 'healthy').length,
      warning: ACCOUNTS.filter(a => a.health === 'warning').length,
      atRisk: ACCOUNTS.filter(a => a.health === 'at_risk').length,
      totalMRR,
      atRiskMRR,
      warningMRR,
      churnRisk: Math.round(atRiskMRR / totalMRR * 100)
    },
    accounts: ACCOUNTS,
    insights: [
      { type: 'critical', title: 'Hooli at risk of churn', detail: '$15k MRR at risk. Product usage dropped 55%. Competitor evaluation detected.', action: 'Schedule executive business review' },
      { type: 'warning', title: 'Wayne Enterprises renewal in 6 days', detail: '$20k MRR. Executive sponsor unresponsive. Escalate to CEO.', action: 'Send renewal package with CEO note' },
      { type: 'opportunity', title: 'Acme Corp expansion opportunity', detail: 'Product usage grew 34% despite support issues. Potential upsell.', action: 'Prepare expansion proposal' }
    ]
  };
}

function getAccountDetail(accountId) {
  return ACCOUNTS.find(a => a.id === accountId) || null;
}

function triggerHealthIntervention(data, accountId) {
  const account = ACCOUNTS.find(a => a.id === accountId);
  if (!account) return null;
  const intervention = {
    id: crypto.randomUUID(),
    accountId: account.id,
    accountName: account.name,
    type: 'health_intervention',
    status: 'active',
    createdAt: new Date().toISOString(),
    steps: [
      { title: `Review ${account.name} account health`, owner: 'Customer Agent', status: 'active' },
      { title: `Schedule executive check-in with ${account.name}`, owner: 'CEO', status: 'queued' },
      { title: 'Prepare retention proposal', owner: 'Customer Agent', status: 'queued' }
    ]
  };
  data.notifications.unshift({
    id: `health-${Date.now()}`,
    kind: 'risk',
    title: `🩺 Health intervention: ${account.name}`,
    detail: `${account.riskFactors.length} risk factors identified. $${account.mrr.toLocaleString()} MRR at stake.`,
    read: false,
    createdAt: new Date().toISOString()
  });
  return intervention;
}

module.exports = { getCustomerHealth, getAccountDetail, triggerHealthIntervention };