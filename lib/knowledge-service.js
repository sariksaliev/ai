const crypto = require('crypto');

const DEFAULT_SOURCES = [
  { id: 'src-1', name: 'Google Drive - Strategy', type: 'drive', freshness: 96, lastVerified: '2026-07-22', documents: 124 },
  { id: 'src-2', name: 'Notion - Product Docs', type: 'notion', freshness: 92, lastVerified: '2026-07-21', documents: 89 },
  { id: 'src-3', name: 'Slack - Sales Channel', type: 'slack', freshness: 98, lastVerified: '2026-07-22', messages: 1240 },
  { id: 'src-4', name: 'HubSpot - CRM Knowledge', type: 'crm', freshness: 94, lastVerified: '2026-07-22', documents: 312 },
  { id: 'src-5', name: 'Confluence - Engineering', type: 'confluence', freshness: 88, lastVerified: '2026-07-20', documents: 67 }
];

function getKnowledgeBase() {
  return {
    totalSources: 4812,
    freshnessScore: 94,
    sources: DEFAULT_SOURCES,
    categories: [
      { name: 'Sales Playbooks', count: 234, freshness: 95 },
      { name: 'Product Documentation', count: 567, freshness: 91 },
      { name: 'Customer Cases', count: 891, freshness: 97 },
      { name: 'Marketing Strategy', count: 156, freshness: 88 },
      { name: 'Financial Models', count: 78, freshness: 93 }
    ]
  };
}

function searchKnowledge(query) {
  const q = query.toLowerCase();
  const results = [];
  
  if (q.includes('sale') || q.includes('pipeline') || q.includes('deal')) {
    results.push({
      source: 'Sales Playbooks',
      title: 'Enterprise Sales Process v3',
      snippet: 'The enterprise sales process follows a 7-stage methodology...',
      relevance: 0.95,
      freshness: 95,
      url: '/knowledge/sales-process-v3'
    });
    results.push({
      source: 'HubSpot - CRM Knowledge',
      title: 'Pipeline Management Guidelines',
      snippet: 'Maintain pipeline coverage of 3x or higher for predictable revenue...',
      relevance: 0.92,
      freshness: 94,
      url: '/knowledge/pipeline-guidelines'
    });
  }
  
  if (q.includes('customer') || q.includes('churn') || q.includes('support')) {
    results.push({
      source: 'Customer Cases',
      title: 'Churn Prevention Framework',
      snippet: 'Early warning signals include decreased login frequency, support ticket volume increase...',
      relevance: 0.93,
      freshness: 97,
      url: '/knowledge/churn-framework'
    });
  }
  
  if (q.includes('market') || q.includes('campaign') || q.includes('ad')) {
    results.push({
      source: 'Marketing Strategy',
      title: 'Q3 Campaign Performance Review',
      snippet: 'EU campaign audience change resulted in 24% SQL decline...',
      relevance: 0.89,
      freshness: 88,
      url: '/knowledge/q3-campaign-review'
    });
  }
  
  if (results.length === 0) {
    results.push({
      source: 'General Knowledge',
      title: 'Axiom OS Company Overview',
      snippet: 'Nimbus Labs provides AI-powered business automation solutions...',
      relevance: 0.75,
      freshness: 96,
      url: '/knowledge/company-overview'
    });
  }
  
  return { query, totalResults: results.length, results };
}

function verifySourceFreshness(data, sourceId) {
  const source = DEFAULT_SOURCES.find(s => s.id === sourceId);
  if (!source) return null;
  source.freshness = Math.min(100, source.freshness + 5);
  source.lastVerified = new Date().toISOString().split('T')[0];
  return source;
}

module.exports = { getKnowledgeBase, searchKnowledge, verifySourceFreshness };

