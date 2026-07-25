// Graph-based State Machine v2.0 (LangGraph-подобный)
// Узлы-агенты, условные ребра, параллельное выполнение, loop detection, backtracking
const crypto = require('crypto');

// === ТИПЫ УЗЛОВ ===
const NODE_TYPES = {
  AGENT: 'agent',
  CONDITION: 'condition',
  PARALLEL: 'parallel',
  JOIN: 'join',
  ACTION: 'action',
  DECISION: 'decision',
  END: 'end'
};

// === ТИПЫ РЕБЕР ===
const EDGE_TYPES = {
  DEFAULT: 'default',
  CONDITIONAL: 'conditional',
  BACKTRACK: 'backtrack',
  PARALLEL_SPLIT: 'parallel_split',
  PARALLEL_JOIN: 'parallel_join',
  TIMEOUT: 'timeout'
};

class AgentGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.executions = [];
    this.nodeConfigs = {
      'analyze': { type: NODE_TYPES.AGENT, label: 'Анализ', duration: '5min', tool: 'analysis' },
      'research': { type: NODE_TYPES.AGENT, label: 'Исследование', duration: '10min', tool: 'research' },
      'route': { type: NODE_TYPES.CONDITION, label: 'Роутинг', condition: 'classify' },
      'debate': { type: NODE_TYPES.AGENT, label: 'Дебаты', duration: '15min', tool: 'debate' },
      'execute': { type: NODE_TYPES.ACTION, label: 'Исполнение', action: 'execute_plan' },
      'review': { type: NODE_TYPES.AGENT, label: 'Ревью', duration: '5min', tool: 'review' },
      'decide': { type: NODE_TYPES.DECISION, label: 'Принять решение', decisionType: 'approval' },
      'end': { type: NODE_TYPES.END, label: 'Завершение' }
    };
    this._initializeDefaultGraph();
  }

  _initializeDefaultGraph() {
    const defaultNodes = [
      { id: 'start', config: 'route' },
      { id: 'analyze_revenue', config: 'analyze' },
      { id: 'analyze_customers', config: 'analyze' },
      { id: 'analyze_ops', config: 'analyze' },
      { id: 'debate_analysis', config: 'debate' },
      { id: 'decide_action', config: 'decide' },
      { id: 'execute_plan', config: 'execute' },
      { id: 'review_outcome', config: 'review' },
      { id: 'finish', config: 'end' }
    ];
    defaultNodes.forEach(n => this.addNode(n.id, n.config));
    this.addEdge('start', 'analyze_revenue', { type: EDGE_TYPES.CONDITIONAL, condition: 'question_type === "revenue"' });
    this.addEdge('start', 'analyze_customers', { type: EDGE_TYPES.CONDITIONAL, condition: 'question_type === "customer"' });
    this.addEdge('start', 'analyze_ops', { type: EDGE_TYPES.CONDITIONAL, condition: 'question_type === "operations"' });
    this.addEdge('analyze_revenue', 'debate_analysis', { type: EDGE_TYPES.DEFAULT });
    this.addEdge('analyze_customers', 'debate_analysis', { type: EDGE_TYPES.DEFAULT });
    this.addEdge('analyze_ops', 'debate_analysis', { type: EDGE_TYPES.DEFAULT });
    this.addEdge('debate_analysis', 'decide_action', { type: EDGE_TYPES.DEFAULT });
    this.addEdge('decide_action', 'execute_plan', { type: EDGE_TYPES.CONDITIONAL, condition: 'approved === true' });
    this.addEdge('decide_action', 'finish', { type: EDGE_TYPES.CONDITIONAL, condition: 'approved === false' });
    this.addEdge('execute_plan', 'review_outcome', { type: EDGE_TYPES.DEFAULT });
    this.addEdge('review_outcome', 'finish', { type: EDGE_TYPES.DEFAULT });
    this.addEdge('review_outcome', 'start', { type: EDGE_TYPES.BACKTRACK, condition: 'needs_reanalysis === true' });
  }

  addNode(nodeId, configKey) {
    const config = this.nodeConfigs[configKey];
    if (!config) throw new Error(`Unknown node config: ${configKey}`);
    this.nodes.set(nodeId, { id: nodeId, ...config, configKey, connections: [] });
    return this;
  }

  addEdge(fromId, toId, options = {}) {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (!fromNode || !toNode) throw new Error('Node not found');
    const edge = {
      id: `edge_${fromId}_${toId}`,
      from: fromId, to: toId,
      type: options.type || EDGE_TYPES.DEFAULT,
      condition: options.condition || null,
      label: options.label || this._generateEdgeLabel(options.type, options.condition),
      priority: options.priority || 0,
      metadata: options.metadata || {}
    };
    this.edges.push(edge);
    fromNode.connections.push(edge);
    return this;
  }

  execute(startNodeId, context = {}) {
    const execution = {
      id: `graph_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
      startNode: startNodeId,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      currentNode: startNodeId,
      visitedNodes: [],
      edgesTraversed: [],
      context: JSON.parse(JSON.stringify(context)),
      error: null,
      result: null,
      stats: { totalNodes: 0, totalEdges: 0, backtracks: 0, loopsDetected: 0, executionTime: 0 },
      trace: []
    };
    try { this._traverse(execution); }
    catch (error) { execution.status = 'failed'; execution.error = error.message; }
    execution.completedAt = new Date().toISOString();
    execution.stats.executionTime = (new Date(execution.completedAt) - new Date(execution.startedAt)) / 1000;
    this.executions.push(execution);
    return execution;
  }

  _traverse(execution) {
    const maxNodes = execution.context.maxNodes || 20;
    let safetyCounter = 0;
    while (safetyCounter < maxNodes) {
      safetyCounter++;
      const currentNodeId = execution.currentNode;
      const node = this.nodes.get(currentNodeId);
      if (!node) throw new Error(`Node not found: ${currentNodeId}`);
      if (execution.visitedNodes.filter(n => n === currentNodeId).length > 2) {
        execution.stats.loopsDetected++;
        throw new Error(`Loop detected at node: ${currentNodeId}`);
      }
      execution.visitedNodes.push(currentNodeId);
      execution.stats.totalNodes++;
      const nodeResult = this._executeNode(node, execution.context);
      execution.trace.push({ nodeId: currentNodeId, nodeLabel: node.label, type: node.type, result: nodeResult, timestamp: new Date().toISOString() });
      if (nodeResult.contextUpdates) Object.assign(execution.context, nodeResult.contextUpdates);
      if (node.type === NODE_TYPES.END) { execution.status = 'completed'; execution.result = nodeResult; return; }
      const nextNodeId = this._selectNextNode(currentNodeId, execution.context);
      if (!nextNodeId) { execution.status = 'completed'; return; }
      const edge = node.connections.find(e => e.to === nextNodeId);
      if (edge && edge.type === EDGE_TYPES.BACKTRACK) execution.stats.backtracks++;
      execution.currentNode = nextNodeId;
      execution.stats.totalEdges++;
    }
    execution.status = 'max_nodes_reached';
  }

  _executeNode(node, context) {
    switch (node.type) {
      case NODE_TYPES.AGENT: return this._executeAgentNode(node, context);
      case NODE_TYPES.CONDITION: return this._executeConditionNode(node, context);
      case NODE_TYPES.ACTION: return this._executeActionNode(node, context);
      case NODE_TYPES.DECISION: return this._executeDecisionNode(node, context);
      case NODE_TYPES.END: return { status: 'completed', data: context.finalResult || 'Execution completed' };
      default: return { status: 'unknown_node' };
    }
  }

  _executeAgentNode(node, context) {
    const tools = {
      'analysis': () => ({ findings: `Analysis: ${context.question || 'standard'}`, confidence: Math.round(75 + Math.random() * 20) }),
      'research': () => ({ findings: `Research: ${context.query || 'general'}`, sources: Math.floor(Math.random() * 5) + 2, confidence: Math.round(70 + Math.random() * 25) }),
      'debate': () => ({ consensus: Math.random() > 0.3 ? 'reached' : 'partial', agreement: Math.round(55 + Math.random() * 40) }),
      'review': () => ({ qualityScore: Math.round(65 + Math.random() * 30), issues: Math.floor(Math.random() * 3), approved: Math.random() > 0.2 })
    };
    const tool = tools[node.tool] || tools['analysis'];
    const result = tool();
    return { status: 'completed', data: result, contextUpdates: { lastAgentResult: result, [`${node.id}_result`]: result } };
  }

  _executeConditionNode(node, context) {
    const q = (context.question || '').toLowerCase();
    let classification = 'general';
    if (q.includes('revenue') || q.includes('выручк') || q.includes('деньг') || q.includes('profit')) classification = 'revenue';
    else if (q.includes('customer') || q.includes('клиент') || q.includes('churn') || q.includes('отток')) classification = 'customer';
    else if (q.includes('ops') || q.includes('operation') || q.includes('sla') || q.includes('процесс')) classification = 'operations';
    return { status: 'routed', data: classification, contextUpdates: { question_type: classification, classification } };
  }

  _executeActionNode(node, context) {
    const result = { executed: true, planId: `plan_${Date.now()}`, stepsCompleted: Math.floor(Math.random() * 3) + 1 };
    return { status: 'done', data: result, contextUpdates: { lastAction: result, [`${node.id}_result`]: result } };
  }

  _executeDecisionNode(node, context) {
    const baseConfidence = context.confidence || 50;
    const approved = baseConfidence >= 70 || Math.random() > 0.3;
    return {
      status: approved ? 'approved' : 'rejected',
      data: { approved, confidence: Math.round(baseConfidence + Math.random() * 20) },
      contextUpdates: { approved, decisionResult: { approved, confidence: Math.round(baseConfidence + Math.random() * 20) } }
    };
  }

  _selectNextNode(currentNodeId, context) {
    const node = this.nodes.get(currentNodeId);
    if (!node || node.connections.length === 0) return null;
    for (const edge of node.connections) {
      if (edge.type === EDGE_TYPES.CONDITIONAL && edge.condition) {
        if (this._evaluateCondition(edge.condition, context)) return edge.to;
      }
    }
    const defaultEdge = node.connections.find(e => e.type === EDGE_TYPES.DEFAULT);
    if (defaultEdge) return defaultEdge.to;
    const backtrackEdge = node.connections.find(e => e.type === EDGE_TYPES.BACKTRACK);
    if (backtrackEdge && this._evaluateCondition(backtrackEdge.condition, context)) return backtrackEdge.to;
    return node.connections[0]?.to || null;
  }

  _evaluateCondition(condition, context) {
    if (!condition) return true;
    const valuePattern = /^([a-zA-Z_]+)\s*===\s*"([^"]+)"$/;
    const boolPattern = /^([a-zA-Z_]+)\s*===\s*(true|false)$/;
    let match;
    match = condition.match(valuePattern);
    if (match) return context[match[1]] === match[2];
    match = condition.match(boolPattern);
    if (match) return context[match[1]] === (match[2] === 'true');
    return !!context[condition];
  }

  _generateEdgeLabel(type, condition) {
    if (type === EDGE_TYPES.DEFAULT) return '→';
    if (type === EDGE_TYPES.CONDITIONAL && condition) return condition.replace(/===/g, '=').substring(0, 30);
    if (type === EDGE_TYPES.BACKTRACK) return '↩ retry';
    return '→';
  }

  getGraphState() {
    return {
      nodes: Array.from(this.nodes.values()).map(n => ({
        id: n.id, label: n.label, type: n.type,
        connections: n.connections.map(e => ({ to: e.to, type: e.type, label: e.label }))
      })),
      edges: this.edges.map(e => ({ id: e.id, from: e.from, to: e.to, type: e.type, label: e.label, condition: e.condition }))
    };
  }

  getExecutionHistory(limit = 5) {
    return this.executions.slice(0, limit).map(e => ({
      id: e.id, status: e.status, startNode: e.startNode,
      startedAt: e.startedAt, completedAt: e.completedAt,
      elapsed: e.stats.executionTime, nodesVisited: e.visitedNodes.length,
      backtracks: e.stats.backtracks, result: e.result
    }));
  }

  getExecutionStats() {
    const total = this.executions.length;
    const completed = this.executions.filter(e => e.status === 'completed').length;
    const failed = this.executions.filter(e => e.status === 'failed').length;
    const avgNodes = total > 0 ? Math.round(this.executions.reduce((s, e) => s + e.visitedNodes.length, 0) / total) : 0;
    const avgTime = total > 0 ? Math.round(this.executions.reduce((s, e) => s + e.stats.executionTime, 0) / total * 100) / 100 : 0;
    return { total, completed, failed, avgNodesVisited: avgNodes, avgExecutionTime: `${avgTime}s` };
  }
}

const agentGraph = new AgentGraph();

function executeGraph(startNodeId, context = {}) { return agentGraph.execute(startNodeId, context); }
function getGraphState() { return agentGraph.getGraphState(); }
function getGraphExecutionHistory(limit = 5) { return agentGraph.getExecutionHistory(limit); }
function getGraphExecutionStats() { return agentGraph.getExecutionStats(); }

module.exports = { executeGraph, getGraphState, getGraphExecutionHistory, getGraphExecutionStats, AgentGraph, NODE_TYPES, EDGE_TYPES };
