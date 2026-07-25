const crypto = require('crypto');
function createRecoveryWorkflow(data, investigation) {
  const workflow = { id: crypto.randomUUID(), type: 'revenue-recovery', title: 'EU pipeline recovery', status: 'in_progress', createdAt: new Date().toISOString(), sourceInvestigationId: investigation.id, targetImpact: investigation.impact, steps: [
    { id: crypto.randomUUID(), title: 'Restore high-intent EU audience', owner: 'Marketing Agent', status: 'active', due: 'Today' },
    { id: crypto.randomUUID(), title: 'Prepare follow-up for 17 delayed leads', owner: 'Sales Agent', status: 'queued', due: 'Today' },
    { id: crypto.randomUUID(), title: 'Open renewal interventions for 3 accounts', owner: 'Customer Agent', status: 'queued', due: 'Tomorrow' }
  ] };
  data.workflows.unshift(workflow);
  return workflow;
}
module.exports = { createRecoveryWorkflow };
