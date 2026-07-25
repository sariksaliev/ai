function getForecast() {
  return {
    pipeline: {
      current: 2700000,
      forecast: 3200000,
      target: 3500000,
      probability: 74,
      confidence: 'medium',
      trend: [
        { month: 'May', actual: 2800000, forecast: 2900000 },
        { month: 'Jun', actual: 2650000, forecast: 2800000 },
        { month: 'Jul', actual: 2700000, forecast: 2750000 },
        { month: 'Aug', forecast: 3000000 },
        { month: 'Sep', forecast: 3200000 }
      ]
    },
    revenue: {
      current: 842120,
      forecast: 885000,
      target: 900000,
      probability: 82,
      confidence: 'high',
      trend: [
        { month: 'Feb', actual: 710000 },
        { month: 'Mar', actual: 745000 },
        { month: 'Apr', actual: 723000 },
        { month: 'May', actual: 768000 },
        { month: 'Jun', actual: 792000 },
        { month: 'Jul', actual: 842120 },
        { month: 'Aug', forecast: 860000 },
        { month: 'Sep', forecast: 885000 }
      ]
    },
    cashRunway: {
      current: 18.4,
      forecast: 16.2,
      minimum: 12,
      confidence: 'high',
      trend: [
        { month: 'Feb', value: 22.1 },
        { month: 'Mar', value: 21.4 },
        { month: 'Apr', value: 20.2 },
        { month: 'May', value: 19.6 },
        { month: 'Jun', value: 18.9 },
        { month: 'Jul', value: 18.4 },
        { month: 'Aug', forecast: 17.3 },
        { month: 'Sep', forecast: 16.2 }
      ]
    },
    quarterlyPlan: {
      q3Target: 2700000,
      currentProgress: 842120,
      percentComplete: 31,
      projectedCompletion: 88,
      riskLevel: 'moderate',
      keyRisks: [
        'EU pipeline 18% below plan',
        '3 enterprise deals stalled',
        'Campaign performance declined 24%'
      ]
    },
    recommendations: [
      { action: 'Accelerate EU pipeline recovery', impact: '+$180k', priority: 'critical' },
      { action: 'Increase SDR activity on enterprise accounts', impact: '+$120k', priority: 'high' },
      { action: 'Optimize ad spend to high-performing channels', impact: '+$60k', priority: 'medium' }
    ]
  };
}

function getForecastAlert() {
  return {
    hasAlert: true,
    severity: 'warning',
    title: 'Q3 revenue target at risk',
    detail: 'Current projection shows 88% attainment. EU pipeline recovery is critical to close the gap.',
    gap: 108000,
    daysRemaining: 68
  };
}

module.exports = { getForecast, getForecastAlert };