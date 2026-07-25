// Business Knowledge Graph v3.0
// Динамический граф с историей изменений, аналитикой связей, обновлением через агентов
const crypto = require('crypto');

const NODE_TYPES = {
  METRIC: 'metric', CUSTOMER: 'customer', AGENT: 'agent', CAMPAIGN: 'campaign',
  GOAL: 'goal', DECISION: 'decision', INITIATIVE: 'initiative', RISK: 'risk', REPORT: 'report'
};

const EDGE_TYPES = {
  DRIVES: 'drives', CONVERTS: 'converts', AFFECTS: 'affects', CONTRIBUTES: 'contributes',
  CORRELATES: 'correlates', MONITORS: 'monitors', MANAGES: 'manages', IMPROVES: 'improves',
  RISK: 'risk', DEPENDS: 'depends', GENERATES: 'generates', BLOCKS: 'blocks'
};

class BusinessGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.changelog = [];
    this._initializeDefaultGraph();
  }

  _initializeDefaultGraph() {
    const defaultNodes = [
      { id: 'revenue', type: NODE_TYPES.METRIC, label: 'Monthly Revenue', value: '$842,120', group: 'financial', trend: 'up', change: 8.2 },
      { id: 'pipeline', type: NODE_TYPES.METRIC, label: 'Pipeline Coverage', value: '2.7×', group: 'financial', trend: 'down', change: -12.4 },
      { id: 'retention', type: NODE_TYPES.METRIC, label: 'Net Revenue Retention', value: '112.6%', group: 'financial', trend: 'up', change: 1.8 },
      { id: 'runway', type: NODE_TYPES.METRIC, label: 'Cash Runway', value: '18.4 mo', group: 'financial', trend: 'stable', change: 0 },
      { id: 'sqls', type: NODE_TYPES.METRIC, label: 'SQLs', value: '4,218', group: 'pipeline', trend: 'down', change: -24 },
      { id: 'adspend', type: NODE_TYPES.METRIC, label: 'Ad Spend', value: '$203k', group: 'marketing', trend: 'up', change: 5 },
      { id: 'opps', type: NODE_TYPES.METRIC, label: 'Opportunities', value: '312', group: 'pipeline', trend: 'stable', change: 0 },
      { id: 'won', type: NODE_TYPES.METRIC, label: 'Won Deals', value: '87', group: 'pipeline', trend: 'up', change: 3 },
      { id: 'atrisk', type: NODE_TYPES.METRIC, label: 'At Risk Deals', value: '24', group: 'pipeline', trend: 'up', change: 12 },
      { id: 'campaign_eu', type: NODE_TYPES.CAMPAIGN, label: 'EU Campaign', value: 'Active', group: 'marketing', trend: 'down', change: -18 },
      { id: 'campaign_us', type: NODE_TYPES.CAMPAIGN, label: 'US Campaign', value: 'Active', group: 'marketing', trend: 'up', change: 4 },
      { id: 'acme_corp', type: NODE_TYPES.CUSTOMER, label: 'Acme Corp', value: '$12k MRR', group: 'customers', trend: 'stable', change: 0 },
      { id: 'globex', type: NODE_TYPES.CUSTOMER, label: 'Globex Inc', value: '$8.5k MRR', group: 'customers', trend: 'up', change: 34 },
      { id: 'hooli', type: NODE_TYPES.CUSTOMER, label: 'Hooli', value: '$15k MRR', group: 'customers', trend: 'down', change: -55 },
      { id: 'wayne', type: NODE_TYPES.CUSTOMER, label: 'Wayne Enterprises', value: '$20k MRR', group: 'customers', trend: 'down', change: -12 },
      { id: 'agent_sales', type: NODE_TYPES.AGENT, label: 'Sales Agent', value: 'Active', group: 'agents' },
      { id: 'agent_marketing', type: NODE_TYPES.AGENT, label: 'Marketing Agent', value: 'Active', group: 'agents' },
      { id: 'agent_customer', type: NODE_TYPES.AGENT, label: 'Customer Agent', value: 'Active', group: 'agents' },
      { id: 'agent_finance', type: NODE_TYPES.AGENT, label: 'Finance Agent', value: 'Active', group: 'agents' },
      { id: 'agent_ceo', type: NODE_TYPES.AGENT, label: 'CEO Agent', value: 'Active', group: 'agents' },
      { id: 'agent_ops', type: NODE_TYPES.AGENT, label: 'Operations Agent', value: 'Active', group: 'agents' }
    ];
    defaultNodes.forEach(n => this.nodes.set(n.id, { ...n }));

    const defaultEdges = [
      { source: 'adspend', target: 'sqls', type: EDGE_TYPES.DRIVES, strength: 0.61 },
      { source: 'sqls', target: 'opps', type: EDGE_TYPES.CONVERTS, strength: 0.28 },
      { source: 'opps', target: 'won', type: EDGE_TYPES.CONVERTS, strength: 0.22 },
      { source: 'opps', target: 'atrisk', type: EDGE_TYPES.RISK, strength: 0.08 },
      { source: 'won', target: 'revenue', type: EDGE_TYPES.CONTRIBUTES, strength: 1.0 },
      { source: 'campaign_eu', target: 'sqls', type: EDGE_TYPES.AFFECTS, strength: 0.54 },
      { source: 'campaign_us', target: 'sqls', type: EDGE_TYPES.AFFECTS, strength: 0.12 },
      { source: 'revenue', target: 'retention', type: EDGE_TYPES.CORRELATES, strength: 0.42 },
      { source: 'revenue', target: 'runway', type: EDGE_TYPES.AFFECTS, strength: 0.68 },
      { source: 'acme_corp', target: 'revenue', type: EDGE_TYPES.CONTRIBUTES, strength: 0.014 },
      { source: 'globex', target: 'revenue', type: EDGE_TYPES.CONTRIBUTES, strength: 0.01 },
      { source: 'hooli', target: 'revenue', type: EDGE_TYPES.CONTRIBUTES, strength: 0.018 },
      { source: 'wayne', target: 'revenue', type: EDGE_TYPES.CONTRIBUTES, strength: 0.024 },
      { source: 'hooli', target: 'atrisk', type: EDGE_TYPES.RISK, strength: 0.62 },
      { source: 'wayne', target: 'atrisk', type: EDGE_TYPES.RISK, strength: 0.34 },
      { source: 'agent_sales', target: 'opps', type: EDGE_TYPES.MANAGES, strength: 1.0 },
      { source: 'agent_marketing', target: 'campaign_eu', type: EDGE_TYPES.MANAGES, strength: 1.0 },
      { source: 'agent_marketing', target: 'campaign_us', type: EDGE_TYPES.MANAGES, strength: 1.0 },
      { source: 'agent_marketing', target: 'sqls', type: EDGE_TYPES.IMPROVES, strength: 0.21 },
      { source: 'agent_customer', target: 'acme_corp', type: EDGE_TYPES.MONITORS, strength: 1.0 },
      { source: 'agent_customer', target: 'hooli', type: EDGE_TYPES.MONITORS, strength: 1.0 },
      { source: 'agent_finance', target: 'revenue', type: EDGE_TYPES.MANAGES, strength: 1.0 },
      { source: 'agent_finance', target: 'runway', type: EDGE_TYPES.MANAGES, strength: 1.0 }
    ];
    defaultEdges.forEach(e => this.edges.push(e));
  }

  addNode(nodeData) {
    const id = nodeData.id || `node_${Date.now()}`;
    const node = {
      id,
      type: nodeData.type || NODE_TYPES.METRIC,
      label: nodeData.label || id,
      value: nodeData.value || '',
      group: nodeData.group || 'general',
      trend: nodeData.trend || 'stable',
      change: nodeData.change || 0,
      metadata: nodeData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.nodes.set(id, node);
    this._logChange('node_added', { nodeId: id, label: node.label });
    return node;
  }

  updateNode(nodeId, updates) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    const prevValue = { ...node };
    Object.assign(node, updates, { id: nodeId, updatedAt: new Date().toISOString() });
    this._logChange('node_updated', { nodeId, prev: prevValue, updates });
    return node;
  }

  addEdge(sourceId, targetId, edgeData = {}) {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return null;
    const edge = {
      source: sourceId,
      target: targetId,
      type: edgeData.type || EDGE_TYPES.AFFECTS,
      strength: edgeData.strength || 0.5,
      label: edgeData.label || '',
      metadata: edgeData.metadata || {},
      createdAt: new Date().toISOString()
    };
    const exists = this.edges.some(e => e.source === sourceId && e.target === targetId);
    if (!exists) {
      this.edges.push(edge);
      this._logChange('edge_added', { source: sourceId, target: targetId, type: edge.type });
    }
    return edge;
  }

  updateEdgeStrength(sourceId, targetId, newStrength) {
    const edge = this.edges.find(e => e.source === sourceId && e.target === targetId);
    if (!edge) return null;
    edge.strength = Math.max(0, Math.min(1, newStrength));
    edge.metadata.lastUpdated = new Date().toISOString();
    this._logChange('edge_updated', { source: sourceId, target: targetId, newStrength });
    return edge;
  }

  removeNode(nodeId) {
    if (!this.nodes.has(nodeId)) return false;
    this.nodes.delete(nodeId);
    this.edges = this.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    this._logChange('node_removed', { nodeId });
    return true;
  }

  getNode(nodeId) { return this.nodes.get(nodeId) || null; }

  getGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      stats: {
        totalNodes: this.nodes.size,
        totalEdges: this.edges.length,
        nodeTypes: this._countByType(),
        avgConnections: this.nodes.size > 0
          ? Math.round(this.nodes.reduce((s, n) => s + this.edges.filter(e => e.source === n.id || e.target === n.id).length, 0) / this.nodes.size * 10) / 10
          : 0
      },
      insights: this._generateInsights()
    };
  }

  getNodeConnections(nodeId) {
    const connectedEdges = this.edges.filter(e => e.source === nodeId || e.target === nodeId);
    return connectedEdges.map(e => ({
      direction: e.source === nodeId ? 'outgoing' : 'incoming',
      connectedNodeId: e.source === nodeId ? e.target : e.source,
      connectedNode: this.nodes.get(e.source === nodeId ? e.target : e.source),
      type: e.type,
      strength: e.strength
    }));
  }

  getPath(sourceId, targetId, maxDepth = 5) {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return [];
    const visited = new Set();
    const queue = [{ nodeId: sourceId, path: [sourceId], edges: [] }];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current.nodeId === targetId) return { path: current.path, edges: current.edges };
      if (current.path.length >= maxDepth) continue;
      visited.add(current.nodeId);
      const outgoing = this.edges.filter(e => e.source === current.nodeId);
      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          queue.push({ nodeId: edge.target, path: [...current.path, edge.target], edges: [...current.edges, edge] });
        }
      }
    }
    return [];
  }

  detectImpact(nodeId, depth = 3) {
    const impacted = new Set();
    const queue = [{ nodeId, steps: 0 }];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current.steps >= depth) continue;
      const outgoing = this.edges.filter(e => e.source === current.nodeId);
      for (const edge of outgoing) {
        if (!impacted.has(edge.target)) {
          impacted.add(edge.target);
          queue.push({ nodeId: edge.target, steps: current.steps + 1 });
        }
      }
    }
    return Array.from(impacted).map(id => ({
      nodeId: id,
      node: this.nodes.get(id),
      impactStrength: this._calculateImpactStrength(nodeId, id)
    })).sort((a, b) => b.impactStrength - a.impactStrength);
  }

  inferConnections() {
    const newEdges = [];
    const nodes = Array.from(this.nodes.values());
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (a.group === b.group && a.group !== 'agents') {
          const exists = this.edges.some(e => (e.source === a.id && e.target === b.id) || (e.source === b.id && e.target === a.id));
          if (!exists && Math.random() > 0.8) {
            newEdges.push({ source: a.id, target: b.id, type: EDGE_TYPES.CORRELATES, strength: Math.round(Math.random() * 50) / 100 });
          }
        }
      }
    }
    newEdges.forEach(e => {
      this.edges.push(e);
      this._logChange('inferred_edge', { source: e.source, target: e.target, strength: e.strength });
    });
    return newEdges;
  }

  getChangelog(limit = 50) {
    return this.changelog.slice(0, limit);
  }

  getGraphAnalytics() {
    const nodes = Array.from(this.nodes.values());
    const nodeConnections = nodes.map(n => ({
      nodeId: n.id,
      label: n.label,
      type: n.type,
      connections: this.edges.filter(e => e.source === n.id || e.target === n.id).length,
      trend: n.trend
    })).sort((a, b) => b.connections - a.connections);

    const topConnected = nodeConnections.slice(0, 5);
    const atRisk = nodes.filter(n => n.trend === 'down').length;
    const improving = nodes.filter(n => n.trend === 'up').length;

    const edgeTypeCount = {};
    this.edges.forEach(e => { edgeTypeCount[e.type] = (edgeTypeCount[e.type] || 0) + 1; });

    return {
      summary: {
        totalNodes: nodes.length,
        totalEdges: this.edges.length,
        avgConnections: nodeConnections.reduce((s, n) => s + n.connections, 0) / Math.max(1, nodes.length),
        atRiskNodes: atRisk,
        improvingNodes: improving,
        inferredEdgesCount: this.changelog.filter(c => c.action === 'inferred_edge').length
      },
      topConnected: topConnected.slice(0, 5),
      edgeTypeDistribution: edgeTypeCount,
      trends: { improving, declining: atRisk, stable: nodes.length - atRisk - improving },
      changelogSize: this.changelog.length
    };
  }

  _countByType() {
    const counts = {};
    this.nodes.forEach(n => { counts[n.type] = (counts[n.type] || 0) + 1; });
    return counts;
  }

  _generateInsights() {
    const declining = Array.from(this.nodes.values()).filter(n => n.trend === 'down');
    const improving = Array.from(this.nodes.values()).filter(n => n.trend === 'up');
    const insights = [];
    if (declining.length > 0) {
      insights.push({
        type: 'warning',
        text: `${declining.length} узлов показывают отрицательную динамику. Рекомендуется анализ причин.`,
        nodes: declining.map(n => n.label)
      });
    }
    if (improving.length > 2) {
      insights.push({
        type: 'positive',
        text: `${improving.length} узлов в положительном тренде. Ключевые драйверы: ${improving.slice(0, 3).map(n => n.label).join(', ')}.`,
        nodes: improving.slice(0, 3).map(n => n.label)
      });
    }
    const highConnections = Array.from(this.nodes.values()).filter(n =>
      this.edges.filter(e => e.source === n.id || e.target === n.id).length > 5
    );
    if (highConnections.length > 0) {
      insights.push({
        type: 'info',
        text: `${highConnections.length} узлов являются центральными хабами. Изменения в них могут повлиять на всю систему.`,
        nodes: highConnections.map(n => n.label)
      });
    }
    return insights;
  }

  _calculateImpactStrength(sourceId, targetId) {
    let strength = 0;
    const directEdge = this.edges.find(e => e.source === sourceId && e.target === targetId);
    if (directEdge) strength += directEdge.strength;
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);
    if (sourceNode && targetNode && sourceNode.group === targetNode.group) strength += 0.2;
    return Math.round(Math.min(1, strength) * 100) / 100;
  }

  _logChange(action, data) {
    const change = {
      action,
      timestamp: new Date().toISOString(),
      data
    };
    this.changelog.unshift(change);
    if (this.changelog.length > 500) this.changelog = this.changelog.slice(0, 500);
  }
}

const businessGraph = new BusinessGraph();

function getBusinessGraph() { return businessGraph.getGraph(); }
function getGraphNode(nodeId) { return businessGraph.getNode(nodeId); }
function getNodeConnections(nodeId) { return businessGraph.getNodeConnections(nodeId); }
function getGraphPath(sourceId, targetId, maxDepth = 5) { return businessGraph.getPath(sourceId, targetId, maxDepth); }
function detectGraphImpact(nodeId, depth = 3) { return businessGraph.detectImpact(nodeId, depth); }
function addGraphNode(nodeData) { return businessGraph.addNode(nodeData); }
function addGraphEdge(sourceId, targetId, edgeData = {}) { return businessGraph.addEdge(sourceId, targetId, edgeData); }
function updateGraphNode(nodeId, updates) { return businessGraph.updateNode(nodeId, updates); }
function getGraphAnalytics() { return businessGraph.getGraphAnalytics(); }
function getGraphChangelog(limit = 50) { return businessGraph.getChangelog(limit); }
function inferGraphConnections() { return businessGraph.inferConnections(); }

module.exports = {
  getBusinessGraph, getGraphNode, getNodeConnections, getGraphPath,
  detectGraphImpact, addGraphNode, addGraphEdge, updateGraphNode,
  getGraphAnalytics, getGraphChangelog, inferGraphConnections, BusinessGraph,
  NODE_TYPES, EDGE_TYPES
};
