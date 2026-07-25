// Reflection & Multi-agent Debate Engine v2.0
// Self-critique, iterative refinement, multi-perspective debates, consensus scoring
const crypto = require('crypto');

// Критерии проверки для агента-критика
const CRITIQUE_CRITERIA = [
  { id: 'accuracy', name: 'Точность данных и фактов', weight: 0.25, question: 'Основаны ли выводы на проверяемых данных?' },
  { id: 'relevance', name: 'Релевантность задаче', weight: 0.20, question: 'Отвечают ли выводы на поставленный вопрос?' },
  { id: 'completeness', name: 'Полнота анализа', weight: 0.20, question: 'Учтены ли все важные аспекты?' },
  { id: 'actionability', name: 'Практическая применимость', weight: 0.15, question: 'Можно ли применить эти выводы на практике?' },
  { id: 'logic', name: 'Логическая связность', weight: 0.10, question: 'Логичны ли цепочки рассуждений?' },
  { id: 'novelty', name: 'Новизна и инсайты', weight: 0.10, question: 'Содержатся ли новые, неочевидные инсайты?' }
];

// Роли для дебатов
const DEBATE_ROLES = [
  { id: 'optimist', name: 'Оптимист', perspective: 'Фокус на возможностях и положительных аспектах', bias: 'overconfidence' },
  { id: 'pessimist', name: 'Скептик', perspective: 'Фокус на рисках, узких местах, негативных сценариях', bias: 'underconfidence' },
  { id: 'analyst', name: 'Аналитик', perspective: 'Объективные данные, цифры, факты', bias: 'neutral' },
  { id: 'strategist', name: 'Стратег', perspective: 'Долгосрочные последствия, стратегическое выравнивание', bias: 'long_term_bias' },
  { id: 'customer', name: 'Голос клиента', perspective: 'Клиентский опыт, потребности, боли', bias: 'empathy_bias' },
  { id: 'executor', name: 'Исполнитель', perspective: 'Практическая реализуемость, ресурсы, сроки', bias: 'feasibility_bias' }
];

class AgentReflection {
  constructor() {
    this.critiqueHistory = [];
    this.debateHistory = [];
    this.refinementCycles = [];
  }

  // === REFLECTION: CRITIQUE ===
  critiqueResponse(response, context = {}) {
    const criteria = context.criteria || CRITIQUE_CRITERIA;
    const scores = {};

    // Симуляция оценки по каждому критерию
    criteria.forEach(c => {
      const baseScore = this._simulateCriterionScore(c.id, response, context);
      scores[c.id] = {
        score: baseScore,
        weight: c.weight,
        weightedScore: baseScore * c.weight,
        explanation: this._generateCriterionExplanation(c.id, baseScore, response)
      };
    });

    // Общий weighted score
    const overallScore = criteria.reduce((sum, c) => sum + (scores[c.id]?.weightedScore || 0), 0);
    const maxPossible = criteria.reduce((sum, c) => sum + c.weight, 0);
    const normalizedScore = maxPossible > 0 ? Math.round((overallScore / maxPossible) * 100) : 0;

    // Генерация рекомендаций по улучшению
    const improvements = this._generateImprovements(scores, criteria);

    const critique = {
      id: `critique_${Date.now()}`,
      responseId: context.responseId || null,
      overallScore: normalizedScore,
      scores,
      grade: this._scoreToGrade(normalizedScore),
      improvements,
      summary: this._generateCritiqueSummary(normalizedScore, improvements),
      timestamp: new Date().toISOString(),
      reviewerAgent: context.reviewerAgent || 'AI Critic Agent'
    };

    this.critiqueHistory.unshift(critique);
    return critique;
  }

  // === REFLECTION: ITERATIVE REFINEMENT ===
  refineResponse(initialResponse, context = {}, maxIterations = 3) {
    const cycle = {
      id: `refine_${Date.now()}`,
      context,
      cycles: [],
      finalResponse: null,
      improvements: [],
      startedAt: new Date().toISOString(),
      completedAt: null
    };

    let currentResponse = { ...initialResponse };
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      
      // 1. Critique текущего ответа
      const critique = this.critiqueResponse(currentResponse, {
        ...context,
        responseId: `cycle_${iteration}`,
        cycleNumber: iteration
      });

      // 2. Если оценка > 90%, завершаем
      if (critique.overallScore >= 90) {
        cycle.cycles.push({ iteration, response: { ...currentResponse }, critique, action: 'accepted' });
        break;
      }

      // 3. Улучшаем ответ на основе critique
      const improvedResponse = this._improveResponse(currentResponse, critique, iteration);
      
      cycle.cycles.push({
        iteration,
        response: { ...currentResponse },
        critique,
        improvements: critique.improvements,
        action: 'refined'
      });

      currentResponse = improvedResponse;
    }

    cycle.finalResponse = { ...currentResponse };
    cycle.completedAt = new Date().toISOString();
    cycle.totalCycles = iteration;
    cycle.improvements = cycle.cycles.flatMap(c => c.improvements || []);

    this.refinementCycles.unshift(cycle);
    return cycle;
  }

  // === MULTI-AGENT DEBATE ===
  conductDebate(topic, context = {}) {
    const roles = context.roles || DEBATE_ROLES.slice(0, 4); // По умолчанию 4 роли
    const maxRounds = context.maxRounds || 3;
    
    const debate = {
      id: `debate_${Date.now()}`,
      topic,
      startedAt: new Date().toISOString(),
      completedAt: null,
      rounds: [],
      consensus: null,
      participants: roles.map(r => r.id),
      summary: null
    };

    // Round 1: Начальные позиции
    let round1 = {
      roundNumber: 1,
      statements: roles.map(role => ({
        roleId: role.id,
        roleName: role.name,
        perspective: role.perspective,
        statement: this._generateDebateStatement(topic, role, context, 1),
        confidence: Math.round(60 + Math.random() * 30),
        rebuttals: []
      }))
    };
    debate.rounds.push(round1);

    // Последующие раунды: rebuttals и уточнения
    for (let r = 2; r <= maxRounds; r++) {
      const previousRound = debate.rounds[r - 2];
      const round = {
        roundNumber: r,
        statements: previousRound.statements.map((prevStmt, i) => {
          const role = roles[i];
          // Rebuttals от других ролей
          const rebuttals = previousRound.statements
            .filter((_, j) => j !== i)
            .map((otherStmt, j) => ({
              fromRole: roles[j].name,
              text: this._generateRebuttal(topic, role, roles[j], prevStmt, otherStmt, context),
              agreement: Math.round(20 + Math.random() * 60)
            }));

          // Уточненная позиция
          const refinedStatement = this._refineDebatePosition(topic, role, prevStmt, rebuttals, context);

          return {
            roleId: role.id,
            roleName: role.name,
            perspective: role.perspective,
            statement: refinedStatement.statement,
            confidence: refinedStatement.confidence,
            rebuttals
          };
        })
      };
      debate.rounds.push(round);
    }

    // Consensus finding
    const consensus = this._findConsensus(debate, roles);
    debate.consensus = consensus;
    debate.completedAt = new Date().toISOString();
    debate.summary = this._generateDebateSummary(debate);

    this.debateHistory.unshift(debate);
    return debate;
  }

  // === POLL / VOTING ===
  conductPoll(proposals, voterAgents, context = {}) {
    const votes = voterAgents.map(agentId => ({
      agentId,
      votes: proposals.map(proposal => ({
        proposalId: proposal.id,
        score: Math.round(40 + Math.random() * 60),
        rationale: this._generateVoteRationale(agentId, proposal, context)
      }))
    }));

    // Подсчет результатов
    const results = proposals.map(proposal => {
      const proposalVotes = votes.map(v => v.votes.find(vv => vv.proposalId === proposal.id));
      const avgScore = Math.round(proposalVotes.reduce((s, v) => s + v.score, 0) / proposalVotes.length);
      return {
        proposalId: proposal.id,
        title: proposal.title,
        avgScore,
        totalVotes: proposalVotes.length,
        details: proposalVotes.map(v => ({ agentId: v.agentId, score: v.score, rationale: v.rationale }))
      };
    });

    // Ранжирование
    results.sort((a, b) => b.avgScore - a.avgScore);

    return {
      id: `poll_${Date.now()}`,
      proposals: results,
      totalVoters: voterAgents.length,
      topProposal: results[0],
      timestamp: new Date().toISOString()
    };
  }

  // === GET HISTORY ===
  getCritiqueHistory(limit = 10) { return this.critiqueHistory.slice(0, limit); }
  getDebateHistory(limit = 10) { return this.debateHistory.slice(0, limit); }
  getRefinementHistory(limit = 10) { return this.refinementCycles.slice(0, limit); }

  // === СТАТИСТИКА ===
  getReflectionStats() {
    const totalCritiques = this.critiqueHistory.length;
    const totalDebates = this.debateHistory.length;
    const totalRefinements = this.refinementCycles.length;
    
    const avgScore = totalCritiques > 0
      ? Math.round(this.critiqueHistory.reduce((s, c) => s + c.overallScore, 0) / totalCritiques)
      : 0;

    const consensusRate = totalDebates > 0
      ? Math.round(this.debateHistory.filter(d => d.consensus?.agreement >= 70).length / totalDebates * 100)
      : 0;

    return {
      totalCritiques,
      totalDebates,
      totalRefinements,
      avgCritiqueScore: avgScore,
      consensusRate: `${consensusRate}%`,
      improvementRate: '85%' // Симулировано
    };
  }

  // === ВНУТРЕННИЕ МЕТОДЫ ===

  _simulateCriterionScore(criterionId, response, context) {
    const base = 0.5;
    const variance = Math.random() * 0.4 - 0.2; // [-0.2, 0.2]
    let score = base + variance;

    // Зависимость от типа контекста
    if (criterionId === 'accuracy' && context.hasData) score += 0.2;
    if (criterionId === 'actionability' && context.needsAction) score += 0.15;
    if (criterionId === 'completeness' && context.complexTask) score -= 0.1;

    return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
  }

  _generateCriterionExplanation(criterionId, score, response) {
    const explanations = {
      accuracy: score >= 0.8 ? 'Выводы основаны на проверяемых данных с высокой точностью' 
                 : 'Рекомендуется проверить источники данных',
      relevance: score >= 0.8 ? 'Ответ полностью релевантен поставленной задаче'
                 : 'Ответ частично отклоняется от темы',
      completeness: score >= 0.8 ? 'Учтены все ключевые аспекты задачи'
                   : 'Не хватает анализа некоторых важных аспектов',
      actionability: score >= 0.8 ? 'Выводы имеют четкие практические рекомендации'
                    : 'Рекомендации недостаточно конкретны',
      logic: score >= 0.8 ? 'Цепочки рассуждений логичны и последовательны'
             : 'Обнаружены логические разрывы в рассуждениях',
      novelty: score >= 0.8 ? 'Содержатся новые, неочевидные инсайты'
               : 'Ответ основан на стандартных, ожидаемых выводах'
    };
    return explanations[criterionId] || 'Оценка выполнена автоматически';
  }

  _generateImprovements(scores, criteria) {
    const improvements = [];
    const sortedByScore = criteria
      .map(c => ({ ...c, score: scores[c.id]?.score || 0 }))
      .sort((a, b) => a.score - b.score);

    // Нижние 2 критерия
    sortedByScore.slice(0, 2).forEach(c => {
      if (c.score < 0.7) {
        improvements.push({
          criterion: c.name,
          priority: c.score < 0.5 ? 'high' : 'medium',
          suggestion: this._getImprovementSuggestion(c.id)
        });
      }
    });

    return improvements;
  }

  _getImprovementSuggestion(criterionId) {
    const suggestions = {
      accuracy: 'Проверить данные на актуальность. Указать источники',
      relevance: 'Сфокусироваться на конкретном вопросе. Исключить лишнее',
      completeness: 'Добавить анализ смежных областей. Рассмотреть альтернативы',
      actionability: 'Конкретизировать рекомендации. Добавить сроки и владельцев',
      logic: 'Выстроить четкую цепочку "причина -> следствие"',
      novelty: 'Поискать нетривиальные паттерны в данных'
    };
    return suggestions[criterionId] || 'Улучшить качество ответа';
  }

  _scoreToGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 65) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  _generateCritiqueSummary(score, improvements) {
    const grade = this._scoreToGrade(score);
    const improvementCount = improvements.length;
    const highPriority = improvements.filter(i => i.priority === 'high').length;

    let summary = `Оценка: ${score}% (${grade}). `;
    if (improvementCount > 0) {
      summary += `${improvementCount} области для улучшения (${highPriority} высокого приоритета). `;
    }
    if (score >= 80) {
      summary += 'Ответ хорошего качества, рекомендуется к использованию.';
    } else if (score >= 60) {
      summary += 'Требуется доработка по указанным направлениям.';
    } else {
      summary += 'Ответ требует существенной переработки.';
    }

    return summary;
  }

  _improveResponse(response, critique, iteration) {
    // Симуляция улучшения ответа на основе critique
    const improvements = critique.improvements;
    const improvedResponse = { ...response };
    
    improvements.forEach(imp => {
      if (imp.priority === 'high') {
        // Симуляция исправления
        if (improvedResponse.text) {
          improvedResponse.text = `[Улучшено v${iteration}] ${improvedResponse.text} (${imp.suggestion})`;
        }
      }
    });

    improvedResponse.refinedAt = new Date().toISOString();
    improvedResponse.version = iteration;

    return improvedResponse;
  }

  _generateDebateStatement(topic, role, context, round) {
    const templates = {
      optimist: [
        `Открываются новые возможности для роста: ${topic}`,
        `Мы можем использовать этот тренд для ускорения развития`,
        `Потенциальный выигрыш значительно превышает издержки`
      ],
      pessimist: [
        `Обратите внимание на риски: ${topic} может привести к нестабильности`,
        `Наш опыт показывает, что такие инициативы часто проваливаются`,
        `Не учтены скрытые издержки и возможные негативные последствия`
      ],
      analyst: [
        `Анализ данных показывает: ${topic} имеет 65% вероятность успеха`,
        `Метрики указывают на корреляцию, но не на причинность`,
        `Цифры говорят о том, что ROI составит 180-240% при реализации`
      ],
      strategist: [
        `В долгосрочной перспективе ${topic} выравнивается с нашей стратегией`,
        `Необходимо оценить влияние на позиционирование через 12-24 месяца`,
        `Такое решение усилит наши конкурентные преимущества в будущем`
      ]
    };

    const roleTemplates = templates[role.id] || ['Рассмотрим все аспекты вопроса'];
    return roleTemplates[Math.floor(Math.random() * roleTemplates.length)];
  }

  _generateRebuttal(topic, currentRole, otherRole, currentStmt, otherStmt, context) {
    const templates = [
      `Учитывая аргумент от ${otherRole.name}, я предлагаю рассмотреть дополнительный аспект...`,
      `${otherRole.name} поднимает важный вопрос, но мой анализ показывает другую картину...`,
      `Я согласен с частью аргумента ${otherRole.name}, однако есть нюансы...`,
      `Контраргумент: данные ${otherRole.name} не учитывают фактор X...`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  _refineDebatePosition(topic, role, previousStatement, rebuttals, context) {
    // Уточнение позиции с учетом rebuttals
    const agreementLevel = rebuttals.reduce((s, r) => s + r.agreement, 0) / rebuttals.length;
    let newConfidence = previousStatement.confidence;
    let newStatement = previousStatement.statement;

    if (agreementLevel > 60) {
      newConfidence = Math.min(95, newConfidence + 10);
      newStatement = `${newStatement} (уточнение: после обсуждения с коллегами)`;
    } else {
      newConfidence = Math.max(40, newConfidence - 5);
      newStatement = `${newStatement} (с учетом контраргументов)`;
    }

    return { statement: newStatement, confidence: newConfidence };
  }

  _findConsensus(debate, roles) {
    const finalRound = debate.rounds[debate.rounds.length - 1];
    const avgConfidence = finalRound.statements.reduce((s, st) => s + st.confidence, 0) / finalRound.statements.length;
    
    // Agreement score на основе близости позиций
    const agreementScore = Math.round(50 + Math.random() * 40); // Симулировано

    if (agreementScore >= 70) {
      return {
        reached: true,
        agreement: agreementScore,
        summary: `Достигнут консенсус с уровнем согласия ${agreementScore}%`,
        keyPoints: finalRound.statements.map(s => `[${s.roleName}]: ${s.statement}`)
      };
    }

    return {
      reached: false,
      agreement: agreementScore,
      summary: `Консенсус не достигнут (согласие ${agreementScore}%). Требуется дополнительное обсуждение`,
      remainingDisagreements: finalRound.statements
        .filter(s => s.confidence > 70)
        .map(s => `[${s.roleName}] настаивает на своей позиции`)
    };
  }

  _generateDebateSummary(debate) {
    const rounds = debate.rounds.length;
    const participants = debate.participants.length;
    const consensusReached = debate.consensus?.reached ? 'достигнут' : 'не достигнут';
    
    return `Дебаты по теме "${debate.topic}" завершены. ${rounds} раундов, ${participants} участников. Консенсус ${consensusReached}.`;
  }

  _generateVoteRationale(agentId, proposal, context) {
    const rationales = [
      `На основе исторических данных и текущих трендов`,
      `Соответствует стратегическим приоритетам`,
      `Оптимальное соотношение затрат и результатов`,
      `Учитывая ограниченные ресурсы, это лучший вариант`,
      `Рекомендуется экспертным анализом`
    ];
    return rationales[Math.floor(Math.random() * rationales.length)];
  }
}

const agentReflection = new AgentReflection();

function critiqueResponse(response, context = {}) { return agentReflection.critiqueResponse(response, context); }
function refineResponse(initialResponse, context = {}, maxIterations = 3) { return agentReflection.refineResponse(initialResponse, context, maxIterations); }
function conductDebate(topic, context = {}) { return agentReflection.conductDebate(topic, context); }
function conductPoll(proposals, voterAgents, context = {}) { return agentReflection.conductPoll(proposals, voterAgents, context); }
function getReflectionStats() { return agentReflection.getReflectionStats(); }

module.exports = {
  critiqueResponse,
  refineResponse,
  conductDebate,
  conductPoll,
  getReflectionStats,
  AgentReflection,
  CRITIQUE_CRITERIA,
  DEBATE_ROLES
};
