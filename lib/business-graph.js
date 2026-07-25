function getBusinessGraph() {
  return {
    nodes: [
      { id: 'revenue', type: 'metric', label: 'Monthly Revenue', value: '$842,120', group: 'financial', trend: 'up', change: 8.2 },
      { id: 'pipeline', type: 'metric', label: 'Pipeline Coverage', value: '2.7×', group: 'financial', trend: 'down', change: -12.4 },
      { id: 'retention', type: 'metric', label: 'Net Revenue Retention', value: '112.6%', group: 'financial', trend: 'up', change: 1.8 },
      { id: 'runway', type: 'metric', label: 'Cash Runway', value: '18.4 mo', group: 'financial', trend: 'stable', change: 0 },
      { id: 'sqls', type: 'metric', label: 'SQLs', value: '4,218', group: 'pipeline', trend: 'down', change: -24 },
      { id: 'adspend', type: 'metric', label: 'Ad Spend', value: '$203k', group: 'marketing', trend: 'up', change: 5 },
      { id: 'opps', type: 'metric', label: 'Opportunities', value: '312', group: 'pipeline', trend: 'stable', change: 0 },
      { id: 'won', type: 'metric', label: 'Won Deals', value: '87', group: 'pipeline', trend: 'up', change: 3 },
      { id: 'atrisk', type: 'metric', label: 'At Risk Deals', value: '24', group: 'pipeline', trend: 'up', change: 12 },
      { id: 'campaign_eu', type: 'campaign', label: 'EU Campaign', value: 'Active', group: 'marketing', trend: 'down', change: -18 },
      { id: 'campaign_us', type: 'campaign', label: 'US Campaign', value: 'Active', group: 'marketing', trend: 'up', change: 4 },
      { id: 'acme_corp', type: 'customer', label: 'Acme Corp', value: '$12k MRR', group: 'customers', trend: 'stable', change: 0 },
      { id: 'globex', type: 'customer', label: 'Globex Inc', value: '$8.5k MRR', group: 'customers', trend: 'up', change: 34 },
      { id: 'hooli', type: 'customer', label: 'Hooli', value: '$15k MRR', group: 'customers', trend: 'down', change: -55 },
      { id: 'wayne', type: 'customer', label: 'Wayne Enterprises', value: '$20k MRR', group: 'customers', trend: 'down', change: -12 },
      { id: 'agent_sales', type: 'agent', label: 'Sales Agent', value: 'Active', group: 'agents' },
      { id: 'agent_marketing', type: 'agent', label: 'Marketing Agent', value: 'Active', group: 'agents' },
      { id: 'agent_customer', type: 'agent', label: 'Customer Agent', value: 'Active', group: 'agents' },
      { id: 'agent_finance', type: 'agent', label: 'Finance Agent', value: 'Active', group: 'agents' }
    ],
    edges: [
      { source: 'adspend', target: 'sqls', type: 'drives', strength: 0.61 },
      { source: 'sqls', target: 'opps', type: 'converts', strength: 0.28 },
      { source: 'opps', target: 'won', type: 'converts', strength: 0.22 },
      { source: 'opps', target: 'atrisk', type: 'risk', strength: 0.08 },
      { source: 'won', target: 'revenue', type: 'contributes', strength: 1.0 },
      { source: 'campaign_eu', target: 'sqls', type: 'affects', strength: 0.54 },
      { source: 'campaign_us', target: 'sqls', type: 'affects', strength: 0.12 },
      { source: 'sqls', target: 'pipeline', type: 'drives', strength: 0.75 },
      { source: 'revenue', target: 'retention', type: 'correlates', strength: 0.42 },
      { source: 'revenue', target: 'runway', type: 'affects', strength: 0.68 },
      { source: 'acme_corp', target: 'revenue', type: 'contributes', strength: 0.014 },
      { source: 'globex', target: 'revenue', type: 'contributes', strength: 0.01 },
      { source: 'hooli', target: 'revenue', type: 'contributes', strength: 0.018 },
      { source: 'wayne', target: 'revenue', type: 'contributes', strength: 0.024 },
      { source: 'hooli', target: 'atrisk', type: 'is', strength: 0.62 },
      { source: 'wayne', target: 'atrisk', type: 'is', strength: 0.34 },
      { source: 'agent_sales', target: 'opps', type: 'manages', strength: 1.0 },
      { source: 'agent_marketing', target: 'campaign_eu', type: 'manages', strength: 1.0 },
      { source: 'agent_marketing', target: 'campaign_us', type: 'manages', strength: 1.0 },
      { source: 'agent_marketing', target: 'sqls', type: 'improves', strength: 0.21 },
      { source: 'agent_customer', target: 'acme_corp', type: 'monitors', strength: 1.0 },
      { source: 'agent_customer', target: 'hooli', type: 'monitors', strength: 1.0 },
      { source: 'agent_finance', target: 'revenue', type: 'models', strength: 1.0 },
      { source: 'agent_finance', target: 'runway', type: 'models', strength: 1.0 }
    ],
    insights: [
      { path: 'Ad Spend → SQLs → Pipeline', strength: 'strong', impact: 'EU campaign change caused 24% SQL decline' },
      { path: 'Customer Health → At Risk Deals → Revenue', strength: 'moderate', impact: 'Hooli and Wayne Enterprises risk $35k MRR' },
      { path: 'Sales Agent → Opportunities → Won Deals', strength: 'moderate', impact: '3 stalled deals need next steps' }
    ]
  };
}

module.exports = { getBusinessGraph };