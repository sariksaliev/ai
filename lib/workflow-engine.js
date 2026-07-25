const crypto = require('crypto');

// Advanced Workflow Engine with SLA, dependencies, escalations, retries
function createWorkflow(data, config) {
  const { title, targetImpact, steps, owner } = config;
  const workflow = {
    id: crypto.randomUUID(),
    type: config.type || 'custom',
    title,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    sla: config.sla || null,
    owner: owner || 'AI Agent',
    targetImpact: targetImpact || 'Unknown',
    sourceInvestigationId: config.sourceInvestigationId || null,
    steps: steps.map((s, i) => ({
      id: crypto.randomUUID(),
      title: s.title,
      owner: s.owner || owner || 'AI Agent',
      status: i === 0 ? 'active' : 'queued',
      due: s.due || 'Today',
      dependencies: s.dependencies || [],
      retries: s.retries || 0,
      maxRetries: s.maxRetries || 3,
      sla: s.sla || null,
      escalationContact: s.escalationContact || null,
      approvalRequired: s.approvalRequired || false,
      approvalStatus: s.approvalRequired ? 'pending' : null
    })),
    escalations: [],
    completedAt: null
  };
  data.workflows.unshift(workflow);
  return workflow;
}

function advanceWorkflow(data, workflowId) {
  const workflow = data.workflows.find(w => w.id === workflowId);
  if (!workflow) return { error: 'Workflow not found', status: 404 };

  const activeStep = workflow.steps.find(s => s.status === 'active');
  if (activeStep) {
    activeStep.status = 'done';
    activeStep.completedAt = new Date().toISOString();
  }

  const nextStep = workflow.steps.find(s => s.status === 'queued');
  if (nextStep) {
    const depsMet = nextStep.dependencies.every(depId =>
      workflow.steps.find(s => s.id === depId)?.status === 'done'
    );
    if (depsMet) {
      nextStep.status = 'active';
    } else {
      return { error: 'Dependencies not met', status: 409 };
    }
  } else {
    workflow.status = 'done';
    workflow.completedAt = new Date().toISOString();
  }

  return { workflow, step: activeStep || nextStep };
}

function failStep(data, workflowId, stepId) {
  const workflow = data.workflows.find(w => w.id === workflowId);
  if (!workflow) return { error: 'Workflow not found', status: 404 };
  const step = workflow.steps.find(s => s.id === stepId);
  if (!step) return { error: 'Step not found', status: 404 };

  step.retries++;
  if (step.retries >= step.maxRetries) {
    step.status = 'escalated';
    workflow.escalations.push({
      stepId: step.id,
      reason: 'Max retries exceeded',
      contact: step.escalationContact || 'CEO',
      escalatedAt: new Date().toISOString()
    });
    if (step.escalationContact) {
      data.notifications.unshift({
        id: `esc-${Date.now()}`,
        kind: 'escalation',
        title: `🚨 Escalation: ${step.title}`,
        detail: `Step failed after ${step.retries} retries. Contact: ${step.escalationContact}`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  } else {
    step.status = 'active';
    data.notifications.unshift({
      id: `retry-${Date.now()}`,
      kind: 'workflow',
      title: `🔄 Retrying: ${step.title}`,
      detail: `Attempt ${step.retries + 1}/${step.maxRetries}`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }
  return { workflow, step };
}

function getWorkflowTimeline(data, workflowId) {
  const workflow = data.workflows.find(w => w.id === workflowId);
  if (!workflow) return null;
  return {
    id: workflow.id,
    title: workflow.title,
    status: workflow.status,
    sla: workflow.sla,
    progress: `${workflow.steps.filter(s => s.status === 'done').length}/${workflow.steps.length} steps`,
    steps: workflow.steps.map(s => ({
      title: s.title,
      status: s.status,
      retries: s.retries,
      approvalRequired: s.approvalRequired,
      approvalStatus: s.approvalStatus
    })),
    escalations: workflow.escalations
  };
}

module.exports = { createWorkflow, advanceWorkflow, failStep, getWorkflowTimeline };