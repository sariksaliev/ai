// Decision Center — Approve / Reject / Modify workflow
// Autonomous execution after approval: CRM tasks, Slack, owners, roadmap, reminders, audit

const crypto = require('crypto');
const { addApproval, addDecision, addInitiative, updateInitiative } = require('./business-memory');

const EXECUTION_TYPES = {
  approve: 'Утверждено',
  reject: 'Отклонено',
  modify: 'Изменено'
};

function executeDecision(data, params) {
  const { investigationId, action, modifications } = params;
  
  if (!investigationId) return { error: 'Investigation ID required', status: 400 };
  if (!action || !EXECUTION_TYPES[action]) return { error: 'Valid action required: approve, reject, modify', status: 400 };
  
  const investigation = data.investigations?.find(i => i.id === investigationId);
  if (!investigation) return { error: 'Investigation not found', status: 404 };
  
  if (investigation.status === 'approved' && action === 'approve') {
    return { error: 'Investigation already approved', status: 409 };
  }
  
  const decisionId = `dec_exec_${Date.now()}`;
  const executionLogs = [];
  
  // 1. Update investigation status
  investigation.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'modified';
  investigation.decisionAt = new Date().toISOString();
  
  executionLogs.push({
    step: 'investigation.update',
    status: 'done',
    detail: `Investigation ${investigationId} status updated to ${investigation.status}`,
    timestamp: new Date().toISOString()
  });
  
  // 2. Record in business memory
  if (action === 'approve') {
    addApproval(data, investigationId, investigation.summary || investigation.question, 'CEO');
    addDecision(data, investigation.summary || investigation.question, 'approved', investigation.impact || 'N/A');
    
    // 3. Create CRM tasks (autonomous execution)
    const planTasks = investigation.plan || [];
    planTasks.forEach((step, i) => {
      const task = {
        id: `task_${Date.now()}_${i}`,
        title: step,
        domain: determineDomain(step),
        owner: determineOwner(step),
        lane: 'In progress',
        status: 'active',
        due: i === 0 ? 'Today' : i === 1 ? 'Today' : 'Tomorrow',
        sourceInvestigation: investigationId,
        createdAt: new Date().toISOString()
      };
      data.tasks.push(task);
      
      executionLogs.push({
        step: 'task.create',
        status: 'done',
        detail: `Created task: ${task.title}`,
        owner: task.owner,
        domain: task.domain,
        timestamp: new Date().toISOString()
      });
    });
    
    // 4. Create workflow
    const stepIds = planTasks.map(() => crypto.randomUUID());
    const wfSteps = planTasks.map((step, i) => ({
      id: stepIds[i],
      title: step,
      owner: determineOwner(step),
      status: i === 0 ? 'active' : 'queued',
      due: i === 0 ? 'Today' : i + 1 === planTasks.length ? 'Tomorrow' : 'Today',
      dependencies: i > 0 ? [stepIds[i-1]].filter(Boolean) : [],
      retries: 0,
      maxRetries: 3,
      sla: null,
      escalationContact: null,
      approvalRequired: i === planTasks.length - 1,
      approvalStatus: null
    }));
    
    const workflow = {
      id: crypto.randomUUID(),
      type: 'recovery',
      title: `${investigation.summary?.substring(0, 60) || 'Recovery Plan'}`,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      sla: '48 hours',
      owner: 'AI Agent',
      targetImpact: investigation.impact || 'N/A',
      sourceInvestigationId: investigationId,
      steps: wfSteps,
      escalations: [],
      completedAt: null
    };
    
    data.workflows.unshift(workflow);
    
    executionLogs.push({
      step: 'workflow.create',
      status: 'done',
      detail: `Created workflow: ${workflow.title}`,
      id: workflow.id,
      timestamp: new Date().toISOString()
    });
    
    // 5. Create initiative in business memory
    const initiative = addInitiative(data, {
      title: investigation.summary?.substring(0, 80) || 'Recovery Initiative',
      owner: 'Cross-functional',
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    executionLogs.push({
      step: 'initiative.create',
      status: 'done',
      detail: `Created initiative: ${initiative.title}`,
      id: initiative.id,
      timestamp: new Date().toISOString()
    });
    
    // 6. Create notifications
    data.notifications.unshift({
      id: `notice_${Date.now()}`,
      kind: 'workflow',
      title: 'План утверждён и запущен',
      detail: `Исполнение "${investigation.summary || investigation.question}" начато. Создано ${planTasks.length} задач.`,
      read: false,
      createdAt: new Date().toISOString()
    });
    
    executionLogs.push({
      step: 'notification.send',
      status: 'done',
      detail: 'Team notified about plan execution',
      timestamp: new Date().toISOString()
    });
    
    // 7. Generate follow-up reminder
    const reminder = {
      id: `reminder_${Date.now()}`,
      title: `Review ${initiative.title} progress`,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'follow_up',
      relatedTo: investigationId,
      status: 'pending'
    };
    if (!data.reminders) data.reminders = [];
    data.reminders.push(reminder);
    
    executionLogs.push({
      step: 'reminder.create',
      status: 'done',
      detail: `Follow-up reminder created for ${new Date(reminder.dueAt).toLocaleDateString()}`,
      timestamp: new Date().toISOString()
    });
    
    // 8. Generate audit log
    executionLogs.push({
      step: 'audit.log',
      status: 'done',
      detail: `Decision execution completed for ${investigationId}`,
      timestamp: new Date().toISOString()
    });
  }
  
  // 9. Update roadmap
  if (!data.roadmap) data.roadmap = [];
  const roadmapItem = {
    id: `roadmap_${Date.now()}`,
    title: investigation.summary || investigation.question,
    action: EXECUTION_TYPES[action],
    date: new Date().toISOString(),
    tasksCreated: action === 'approve' ? (investigation.plan?.length || 0) : 0
  };
  data.roadmap.unshift(roadmapItem);
  
  // 10. Store execution logs
  if (!data.executionLogs) data.executionLogs = [];
  const executionRecord = {
    id: `exec_${Date.now()}`,
    decisionId,
    investigationId,
    action,
    timestamp: new Date().toISOString(),
    logs: executionLogs,
    summary: `${EXECUTION_TYPES[action]}: "${investigation.question}"`
  };
  data.executionLogs.unshift(executionRecord);
  
  return {
    decisionId,
    action,
    executionLogs,
    summary: executionRecord.summary,
    tasksCreated: action === 'approve' ? (investigation.plan?.length || 0) : 0,
    status: 'completed'
  };
}

function determineDomain(stepText) {
  const text = stepText.toLowerCase();
  if (text.includes('audien') || text.includes('ads') || text.includes('campaign') || text.includes('маркет') || text.includes('реклам')) return 'Marketing';
  if (text.includes('lead') || text.includes('follow') || text.includes('лид') || text.includes('сделк') || text.includes('продаж')) return 'Sales';
  if (text.includes('renewal') || text.includes('client') || text.includes('клиент') || text.includes('продлен')) return 'Customer';
  if (text.includes('budget') || text.includes('бюджет') || text.includes('cost') || text.includes('затрат')) return 'Finance';
  return 'Operations';
}

function determineOwner(stepText) {
  const domain = determineDomain(stepText);
  const owners = {
    'Marketing': 'Marketing Agent',
    'Sales': 'Sales Agent',
    'Customer': 'Customer Agent',
    'Finance': 'Finance Agent',
    'Operations': 'Operations Agent'
  };
  return owners[domain] || 'AI Agent';
}

function getExecutionLogs(data) {
  return data.executionLogs || [];
}

function getDecisionHistory(data) {
  return data.decisions?.map(d => ({
    id: d.id,
    investigation: d.investigationId,
    action: d.action,
    date: d.timestamp,
    summary: d.summary
  })) || [];
}

module.exports = {
  executeDecision,
  getExecutionLogs,
  getDecisionHistory
};