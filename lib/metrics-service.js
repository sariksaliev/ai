function getMetricsHistory() {
  // Returns time-series data for dashboard sparklines
  return {
    revenue: [
      { month: 'Feb', value: 710000 },
      { month: 'Mar', value: 745000 },
      { month: 'Apr', value: 723000 },
      { month: 'May', value: 768000 },
      { month: 'Jun', value: 792000 },
      { month: 'Jul', value: 842120 }
    ],
    pipeline: [
      { week: 'W18', value: 3.8 },
      { week: 'W19', value: 3.6 },
      { week: 'W20', value: 3.5 },
      { week: 'W21', value: 3.2 },
      { week: 'W22', value: 3.1 },
      { week: 'W23', value: 2.7 }
    ],
    retention: [
      { month: 'Feb', value: 104.2 },
      { month: 'Mar', value: 106.8 },
      { month: 'Apr', value: 108.1 },
      { month: 'May', value: 110.3 },
      { month: 'Jun', value: 111.5 },
      { month: 'Jul', value: 112.6 }
    ],
    runway: [
      { month: 'Feb', value: 22.1 },
      { month: 'Mar', value: 21.4 },
      { month: 'Apr', value: 20.2 },
      { month: 'May', value: 19.6 },
      { month: 'Jun', value: 18.9 },
      { month: 'Jul', value: 18.4 }
    ]
  };
}

function getValueSummary(data) {
  const approved = data.investigations.filter((item) => item.status === 'approved').length;
  const workflows = data.workflows.filter((item) => item.status === 'in_progress').length;
  return {
    currency: 'USD',
    atRiskRevenueIdentified: 71000,
    churnRiskDetected: 19000,
    hoursAutomated: 42,
    approvedPlans: approved,
    activeWorkflows: workflows,
    methodology: 'Demo baseline: potential revenue and churn impact discovered by approved AI investigations; time saved is estimated from completed agent actions.'
  };
}

module.exports = { getMetricsHistory, getValueSummary };