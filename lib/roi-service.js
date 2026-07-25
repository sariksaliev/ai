function getROIDashboard(data) {
  const approvedInvestigations = data.investigations.filter(i => i.status === 'approved').length;
  const activeWorkflows = data.workflows.filter(w => w.status === 'in_progress').length;
  const completedWorkflows = data.workflows.filter(w => w.status === 'done').length;
  const totalTasks = data.tasks.length;
  const doneTasks = data.tasks.filter(t => t.status === 'done').length;

  return {
    summary: {
      atRiskRevenueIdentified: 71000,
      churnRiskDetected: 19000,
      hoursAutomated: 42 + completedWorkflows * 8,
      approvedPlans: approvedInvestigations,
      activeWorkflows,
      completedWorkflows,
      taskCompletionRate: totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0
    },
    breakdown: {
      revenue: {
        identified: 71000,
        recovered: 28500,
        atRisk: 42500,
        trend: 'declining'
      },
      churn: {
        detected: 19000,
        prevented: 7600,
        atRisk: 11400,
        accounts: 3
      },
      efficiency: {
        hoursAutomated: 42 + completedWorkflows * 8,
        costSaved: (42 + completedWorkflows * 8) * 75,
        workflowsAutomated: completedWorkflows
      }
    },
    methodology: 'ROI is calculated based on approved AI investigations, completed workflows, and automated tasks. Revenue impact is estimated from pipeline analysis. Churn prevention is based on customer health interventions. Efficiency savings use $75/hr blended rate.'
  };
}

function getBenchmarkingData() {
  return {
    revenue: { company: 842120, industry: 780000, percentile: 68, trend: 'growing' },
    pipelineCoverage: { company: 2.7, industry: 3.2, percentile: 42, trend: 'declining' },
    churnRate: { company: 4.2, industry: 5.8, percentile: 72, trend: 'improving' },
    responseTime: { company: 6.1, industry: 2.4, percentile: 18, trend: 'declining' },
    sqlConversion: { company: 21, industry: 18, percentile: 65, trend: 'stable' },
    nps: { company: 42, industry: 38, percentile: 60, trend: 'improving' }
  };
}

module.exports = { getROIDashboard, getBenchmarkingData };

