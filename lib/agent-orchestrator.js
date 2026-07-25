// Agent Orchestrator v2.0
// Orchestrator-Worker: декомпозиция задач, диспатч, агрегация
// Dynamic Router: классификация с confidence scoring, контекстный роутинг
// MCTS: Monte Carlo Tree Search для планирования нескольких шагов
const crypto = require('crypto');

// === ДОСТУПНЫЕ АГЕНТЫ-ИСПОЛНИТЕЛИ ===
const WORKER_AGENTS = {
  sales: { id: 'sales', name: 'Торговый агент', capabilities: ['pipeline', 'deals', 'forecast', 'win_rates'], maxLoad: 5 },
  marketing: { id: 'marketing', name: 'Маркетинг-агент', capabilities: ['campaigns', 'ads', 'audience', 'content'], maxLoad: 5 },
  finance: { id: 'finance', name: 'Финансовый агент', capabilities: ['revenue', 'costs', 'runway', 'budget'], maxLoad: 4 },
  customer: { id: 'customer', name: 'Клиентский агент', capabilities: ['retention', 'churn', 'nps', 'health'], maxLoad: 5 },
  operations: { id: 'operations', name: 'Операционный агент', capabilities: ['sla', 'workflow', 'bottlenecks', 'process'], maxLoad: 4 },
  ceo: { id: 'ceo', name: 'CEO-агент', capabilities: ['strategy', 'prioritization', 'coordination', 'decisions'], maxLoad: 3 }
};

// === КЛАССИФИКАТОР ЗАПРОСОВ (Dynamic Router) ===
const ROUTING_PATTERNS = [
  { pattern: /(revenue|выручк|деньг|profit|доход)/i, agent: 'finance', confidence: 0.85 },
  { pattern: /(pipeline|воронк|сделк|deal|forecast|прогноз)/i, agent: 'sales', confidence: 0.90 },
  { pattern: /(customer|клиент|churn|отток|retention|nps)/i, agent: 'customer', confidence: 0.88 },
  { pattern: /(market|маркет|campaign|кампани|ad|реклам)/i, agent: 'marketing', confidence: 0.85 },
  { pattern: /(sla|workflow|процесс|operation|bottleneck)/i, agent: 'operations', confidence: 0.82 },
  { pattern: /(strategy|стратег|priorit|приоритет|ceo)/i, agent: 'ceo', confidence: 0.80 },
  { pattern: /(cost|расход|runway|budget|бюджет)/i, agent: 'finance', confidence: 0.87 },
  { pattern: /(support|поддержк|ticket|тикет)/i, agent: 'customer', confidence: 0.75 }
];

class AgentOrchestrator {
  constructor() {
    this.tasks = [];
    this.workerLoads = {};
    Object.keys(WORKER_AGENTS).forEach(k => { this.workerLoads[k] = 0; });
    this.mctsCache = new Map();
  }

  // === DYNAMIC ROUTER ===
  routeQuery(question, context = {}) {
    const q = question.toLowerCase();
    const scores = {};

    // Scoring по паттернам
    ROUTING_PATTERNS.forEach(rp => {
      const match = q.match(rp.pattern);
      if (match) {
        const agentId = rp.agent;
        if (!scores[agentId]) scores[agentId] = { score: 0, matches: [] };
        scores[agentId].score += rp.confidence;
        scores[agentId].matches.push(match[0]);
      }
    });

    // Учет контекста
    if (context.recentAgents) {
      context.recentAgents.forEach(agentId => {
        if (scores[agentId]) scores[agentId].score += 0.1; // Бонус за недавнее использование
      });
    }

    // Учет загрузки
    Object.entries(this.workerLoads).forEach(([agentId, load]) => {
      if (scores[agentId]) {
        scores[agentId].score -= load * 0.05; // Штраф за перегрузку
      }
    });

    // Ранжирование
    const ranked = Object.entries(scores)
      .map(([agentId, data]) => ({
        agentId,
        agentName: WORKER_AGENTS[agentId]?.name || agentId,
        confidence: Math.round(data.score * 100) / 100,
        matches: data.matches
      }))
      .sort((a, b) => b.confidence - a.confidence);

    // Если ничего не найдено, возвращаем CEO как fallback
    if (ranked.length === 0) {
      return { agentId: 'ceo', agentName: 'CEO-агент', confidence: 0.5, matches: [], fallback: true };
    }

    return ranked[0];
  }

  // === ORCHESTRATOR-WORKER ===
  orchestrateTask(task, data = {}) {
    const taskId = `task_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    
    // 1. Декомпозиция задачи на подзадачи
    const subtasks = this._decomposeTask(task);
    
    // 2. Распределение подзадач по агентам
    const assignments = this._assignSubtasks(subtasks, data);
    
    // 3. Создание оркестрации
    const orchestration = {
      id: taskId,
      originalTask: task,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      subtasks: assignments,
      results: [],
      aggregatedResult: null,
      confidence: 0,
      stats: { totalSubtasks: assignments.length, completed: 0, failed: 0 }
    };

    this.tasks.unshift(orchestration);
    
    // 4. Симуляция выполнения
    this._simulateExecution(orchestration, data);
    
    return orchestration;
  }

  _decomposeTask(task) {
    const q = (task.question || task).toLowerCase();
    const subtasks = [];

    // Анализ pipeline
    if (q.includes('pipeline') || q.includes('воронк') || q.includes('сделк') || q.includes('deal')) {
      subtasks.push({ id: `sub_${Date.now()}_1`, type: 'analysis', target: 'pipeline', question: 'Анализ pipeline и сделок', requiredAgent: 'sales' });
    }
    // Анализ выручки
    if (q.includes('revenue') || q.includes('выручк') || q.includes('деньг') || q.includes('profit')) {
      subtasks.push({ id: `sub_${Date.now()}_2`, type: 'analysis', target: 'revenue', question: 'Анализ выручки и финансов', requiredAgent: 'finance' });
    }
    // Анализ клиентов
    if (q.includes('customer') || q.includes('клиент') || q.includes('churn') || q.includes('отток')) {
      subtasks.push({ id: `sub_${Date.now()}_3`, type: 'analysis', target: 'customers', question: 'Анализ клиентов и оттока', requiredAgent: 'customer' });
    }
    // Анализ маркетинга
    if (q.includes('market') || q.includes('маркет') || q.includes('campaign') || q.includes('кампани')) {
      subtasks.push({ id: `sub_${Date.now()}_4`, type: 'analysis', target: 'marketing', question: 'Анализ маркетинговых кампаний', requiredAgent: 'marketing' });
    }
    // Анализ операций
    if (q.includes('sla') || q.includes('workflow') || q.includes('процесс') || q.includes('operation')) {
      subtasks.push({ id: `sub_${Date.now()}_5`, type: 'analysis', target: 'operations', question: 'Анализ операционных процессов', requiredAgent: 'operations' });
    }

    // Если ничего не подошло, добавляем общий анализ
    if (subtasks.length === 0) {
      subtasks.push({ id: `sub_${Date.now()}_1`, type: 'analysis', target: 'general', question: 'Общий анализ ситуации', requiredAgent: 'ceo' });
    }

    return subtasks;
  }

  _assignSubtasks(subtasks, data) {
    return subtasks.map((sub, i) => {
      const agent = WORKER_AGENTS[sub.requiredAgent];
      this.workerLoads[sub.requiredAgent] = (this.workerLoads[sub.requiredAgent] || 0) + 1;
      
      return {
        ...sub,
        order: i + 1,
        assignedAgent: agent ? { id: agent.id, name: agent.name } : { id: 'ceo', name: 'CEO-агент' },
        status: 'pending',
        startedAt: null,
        completedAt: null,
        result: null,
        confidence: 0
      };
    });
  }

  _simulateExecution(orchestration, data) {
    orchestration.subtasks.forEach((sub, i) => {
      setTimeout(() => {
        sub.status = 'in_progress';
        sub.startedAt = new Date().toISOString();
        
        setTimeout(() => {
          sub.status = 'completed';
          sub.completedAt = new Date().toISOString();
          sub.result = this._generateSubtaskResult(sub, data);
          sub.confidence = Math.round(70 + Math.random() * 25);
          
          orchestration.results.push(sub);
          orchestration.stats.completed++;
          
          // Если все подзадачи выполнены, агрегируем результат
          if (orchestration.stats.completed === orchestration.stats.totalSubtasks) {
            orchestration.status = 'completed';
            orchestration.aggregatedResult = this._aggregateResults(orchestration.results);
            orchestration.confidence = Math.round(
              orchestration.results.reduce((s, r) => s + r.confidence, 0) / orchestration.results.length
            );
          }
        }, 500 + Math.random() * 1000);
      }, i * 200);
    });
  }

  _generateSubtaskResult(subtask, data) {
    const results = {
      pipeline: {
        summary: 'Pipeline содержит 312 сделок на $2.84M. Конверсия 24%. 3 сделки застряли.',
        metrics: { totalDeals: 312, pipelineValue: 2840000, conversionRate: '24%', stuckDeals: 3 },
        recommendations: ['Ускорить сделку Acme Corp ($120K)', 'Провести deal review для застрявших']
      },
      revenue: {
        summary: 'Текущая выручка: $842K. Прогноз Q3: $920K. Рост 12.3% кв/кв.',
        metrics: { currentRevenue: 842000, forecast: 920000, growth: '12.3%' },
        recommendations: ['Фокус на expansion revenue', 'Мониторинг концентрации топ-5 клиентов']
      },
      customers: {
        summary: '142 активных клиента. NPS: 52. 3 клиента под риском оттока ($138K ARR).',
        metrics: { totalCustomers: 142, nps: 52, churnRisk: 3, arrAtRisk: 138000 },
        recommendations: ['Провести executive meeting с Enterprise Inc', 'Запустить программу удержания']
      },
      marketing: {
        summary: '5 активных кампаний. 45.2K трафика/мес. 380 лидов. ROI: 285%.',
        metrics: { activeCampaigns: 5, traffic: 45200, leads: 380, roi: '285%' },
        recommendations: ['Google Ads — лучший канал (320% ROI)', 'Оптимизировать EU кампанию']
      },
      operations: {
        summary: 'SLA compliance: 94%. Среднее время ответа: 2.4 часа. 8 активных workflow.',
        metrics: { slaCompliance: '94%', avgResponseTime: '2.4h', activeWorkflows: 8 },
        recommendations: ['Автоматизировать Security Review', 'Ускорить Customer Onboarding']
      },
      general: {
        summary: 'Компания в хорошем состоянии. Все ключевые метрики в зеленой зоне.',
        metrics: { health: 'good', alerts: 3, pendingActions: 12 },
        recommendations: ['Продолжать мониторинг', 'Фокус на удержании клиентов']
      }
    };

    return results[subtask.target] || results.general;
  }

  _aggregateResults(results) {
    const allRecommendations = results.flatMap(r => r.result?.recommendations || []);
    const allMetrics = results.reduce((acc, r) => ({ ...acc, ...r.result?.metrics }), {});
    
    return {
      summary: `Оркестрация завершена. ${results.length} агентов выполнили анализ.`,
      metrics: allMetrics,
      topRecommendations: allRecommendations.slice(0, 5),
      totalAgentsInvolved: results.length,
      completedAt: new Date().toISOString()
    };
  }

  // === MCTS: MONTE CARLO TREE SEARCH ===
  planWithMCTS(goal, context = {}, iterations = 50) {
    const cacheKey = `${goal}_${JSON.stringify(context)}`;
    if (this.mctsCache.has(cacheKey)) return this.mctsCache.get(cacheKey);

    const rootNode = {
      id: 'root',
      goal,
      state: 'start',
      visits: 0,
      totalReward: 0,
      children: [],
      depth: 0
    };

    // Симуляция MCTS
    for (let i = 0; i < iterations; i++) {
      // 1. Selection
      const selectedPath = this._mctsSelect(rootNode);
      const leafNode = selectedPath[selectedPath.length - 1];

      // 2. Expansion
      if (leafNode.visits > 0 && leafNode.depth < 5) {
        const expanded = this._mctsExpand(leafNode, context);
        if (expanded) {
          selectedPath.push(expanded);
        }
      }

      // 3. Simulation
      const reward = this._mctsSimulate(selectedPath[selectedPath.length - 1], context);

      // 4. Backpropagation
      selectedPath.forEach(node => {
        node.visits++;
        node.totalReward += reward;
      });
    }

    // Выбор лучшего пути
    const bestPath = this._mctsBestPath(rootNode);
    
    const plan = {
      id: `plan_${Date.now()}`,
      goal,
      iterations,
      bestPath: bestPath.map(n => ({
        step: n.id,
        state: n.state,
        confidence: n.visits > 0 ? Math.round((n.totalReward / n.visits) * 100) : 0
      })),
      expectedOutcome: bestPath.length > 0 
        ? `План из ${bestPath.length} шагов с ожидаемым успехом ${Math.round((bestPath[bestPath.length - 1]?.totalReward / Math.max(1, bestPath[bestPath.length - 1]?.visits)) * 100)}%`
        : 'План не найден',
      timestamp: new Date().toISOString()
    };

    this.mctsCache.set(cacheKey, plan);
    return plan;
  }

  _mctsSelect(node) {
    const path = [node];
    let current = node;
    
    while (current.children.length > 0) {
      // UCB1 формула
      current = current.children.reduce((best, child) => {
        if (child.visits === 0) return child;
        const ucb1 = (child.totalReward / child.visits) + 
                     Math.sqrt(2 * Math.log(current.visits) / child.visits);
        const bestUcb1 = best.visits > 0 
          ? (best.totalReward / best.visits) + Math.sqrt(2 * Math.log(current.visits) / best.visits)
          : Infinity;
        return ucb1 > bestUcb1 ? child : best;
      });
      path.push(current);
    }
    
    return path;
  }

  _mctsExpand(node, context) {
    const possibleStates = ['analyze', 'research', 'debate', 'decide', 'execute', 'review'];
    const available = possibleStates.filter(s => !node.children.find(c => c.state === s));
    
    if (available.length === 0) return null;
    
    const newState = available[Math.floor(Math.random() * available.length)];
    const childNode = {
      id: `${node.id}_${newState}`,
      state: newState,
      goal: node.goal,
      visits: 0,
      totalReward: 0,
      children: [],
      depth: node.depth + 1
    };
    
    node.children.push(childNode);
    return childNode;
  }

  _mctsSimulate(node, context) {
    // Симуляция случайного прохода
    let currentState = node.state;
    let reward = 0;
    const maxSteps = 5;
    
    for (let i = 0; i < maxSteps; i++) {
      const transitionReward = this._simulateTransition(currentState, context);
      reward += transitionReward;
      
      if (currentState === 'execute' || currentState === 'review') break;
      currentState = ['analyze', 'research', 'debate', 'decide', 'execute', 'review'][Math.floor(Math.random() * 6)];
    }
    
    return reward / maxSteps;
  }

  _simulateTransition(state, context) {
    const rewards = {
      'analyze': 0.3 + Math.random() * 0.3,
      'research': 0.2 + Math.random() * 0.4,
      'debate': 0.4 + Math.random() * 0.3,
      'decide': 0.5 + Math.random() * 0.3,
      'execute': 0.6 + Math.random() * 0.3,
      'review': 0.3 + Math.random() * 0.4
    };
    return rewards[state] || 0.3;
  }

  _mctsBestPath(node) {
    let current = node;
    const path = [current];
    
    while (current.children.length > 0) {
      const bestChild = current.children.reduce((best, child) => 
        child.visits > best.visits ? child : best
      , current.children[0]);
      
      if (!bestChild || bestChild.visits === 0) break;
      path.push(bestChild);
      current = bestChild;
    }
    
    return path;
  }

  // === API ===
  getOrchestratorStatus() {
    const activeTasks = this.tasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
    
    return {
      activeTasks,
      completedTasks,
      totalTasks: this.tasks.length,
      workerLoads: { ...this.workerLoads },
      availableAgents: Object.values(WORKER_AGENTS).map(a => ({
        ...a,
        currentLoad: this.workerLoads[a.id] || 0,
        available: (this.workerLoads[a.id] || 0) < a.maxLoad
      })),
      mctsCacheSize: this.mctsCache.size
    };
  }

  getTaskDetails(taskId) {
    return this.tasks.find(t => t.id === taskId) || null;
  }
}

const agentOrchestrator = new AgentOrchestrator();

function routeQuery(question, context = {}) { return agentOrchestrator.routeQuery(question, context); }
function orchestrateTask(task, data = {}) { return agentOrchestrator.orchestrateTask(task, data); }
function planWithMCTS(goal, context = {}, iterations = 50) { return agentOrchestrator.planWithMCTS(goal, context, iterations); }
function getOrchestratorStatus() { return agentOrchestrator.getOrchestratorStatus(); }
function getTaskDetails(taskId) { return agentOrchestrator.getTaskDetails(taskId); }

module.exports = {
  routeQuery,
  orchestrateTask,
  planWithMCTS,
  getOrchestratorStatus,
  getTaskDetails,
  AgentOrchestrator,
  WORKER_AGENTS,
  ROUTING_PATTERNS
};
